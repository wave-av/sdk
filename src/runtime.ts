import { stripTrailingSlashes } from './url-util';
import { parseErrorBody } from './errors';
/**
 * WAVE Runtime API client — a thin typed client for any OpenAI-compatible WAVE door.
 *
 * Two doors speak this contract:
 * - the WAVE API gateway at `https://api.wave.online/v1/inference`, authenticated by a WAVE API key
 *   (what the `wave-sdk` CLI uses by default; models and completions both need the key), and
 * - the runtime door at `runtime.wave.online/v1` (alias `dsh.wave.online/v1`), which lists models
 *   without auth and gates completions on its own credential (DISPATCH_PROOF_BEARER / per-user key).
 *
 * The `wave-sdk` CLI and the wave-runtime MCP server both call this client, so the contract lives in
 * one place. Standalone — deliberately not coupled to WaveClient, since the runtime door uses a
 * different credential axis. The token, when set, is sent as a Bearer header on every call and only
 * to the configured base URL.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolSpec {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
}

export interface CompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  /** OpenAI stream options. `stream()` sets `include_usage: true`; the gateway meters streams by it. */
  stream_options?: { include_usage?: boolean };
  tools?: ToolSpec[];
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionChoice {
  index: number;
  message: { role: "assistant"; content: string; tool_calls?: unknown[] };
  finish_reason: string | null;
}

export interface CompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface RuntimeClientOptions {
  /** Base URL of the door, e.g. https://api.wave.online/v1/inference or https://runtime.wave.online/v1 */
  baseUrl: string;
  /** Bearer token. Required by the gateway for every call; the runtime door needs it for completions. */
  token?: string;
  fetchImpl?: typeof fetch;
}

export class RuntimeError extends Error {
  readonly status?: number;
  /** The gateway's error code (e.g. `ROUTE_NOT_FOUND`, `usage_accounting_required`), when it sent one. */
  readonly code?: string;
  /**
   * Actionable fields from the gateway's error body, when it sent any: e.g. `required_scope` on a 403,
   * the x402 `accepts[]` and `error_detail` on a 402, `next_action`, `doc_url` (see parseErrorBody).
   */
  readonly details?: Record<string, unknown>;
  constructor(message: string, status?: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "RuntimeError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Shortest token redactSecret() rewrites. Real WAVE keys are far longer, and a one- or two-character
 * value is not a credential: rewriting it would corrupt every message that contains those characters.
 */
export const MIN_REDACT_LENGTH = 8;

/** Replace every occurrence of `token` in `text` with `[redacted]`. */
export function redactSecret(text: string, token?: string): string {
  return token && token.length >= MIN_REDACT_LENGTH ? text.split(token).join("[redacted]") : text;
}

/**
 * Build a RuntimeError from a non-2xx answer. A JSON error envelope contributes its code, message and
 * actionable details; any other body contributes its first 120 characters. The caller's token is
 * redacted from the body first, so an upstream that echoes it never hands it back.
 */
async function upstreamError(op: string, res: Response, token?: string): Promise<RuntimeError> {
  const text = redactSecret(await res.text().catch(() => ""), token);
  let code: string | undefined;
  let details: Record<string, unknown> | undefined;
  let detail: string;
  try {
    const parsed = parseErrorBody(JSON.parse(text));
    code = parsed.code;
    details = parsed.details;
    detail = [parsed.code, parsed.message].filter(Boolean).join(": ");
  } catch {
    detail = text.trim().slice(0, 120);
  }
  return new RuntimeError(`${op}: upstream ${res.status}${detail ? ` (${detail})` : ""}`, res.status, code, details);
}

/** Sentinel parseSseLine() returns for the `[DONE]` frame. */
const DONE = Symbol("sse-done");

/**
 * Read one SSE line. Returns the parsed `data:` JSON object, DONE for the `[DONE]` sentinel, or
 * undefined for anything else (comments, keep-alives, blank lines, malformed or partial frames).
 */
function parseSseLine(raw: string): Record<string, unknown> | typeof DONE | undefined {
  const line = raw.trim();
  if (!line.startsWith("data:")) return undefined;
  const payload = line.slice(5).trim();
  if (!payload) return undefined;
  if (payload === "[DONE]") return DONE;
  try {
    const parsed = JSON.parse(payload) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

interface ToolCallDelta {
  index?: number;
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface StreamChunk {
  id?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: { content?: string | null; tool_calls?: ToolCallDelta[] };
    message?: { content?: string | null; tool_calls?: unknown[] };
    finish_reason?: string | null;
  }>;
  usage?: CompletionResponse["usage"] | null;
}

/**
 * Fold an SSE body into one CompletionResponse. Some doors answer `text/event-stream` even when the
 * request says `stream: false`; parsing that body as JSON would throw on its `data:` prefix. Content
 * deltas are concatenated and tool-call deltas are merged by index (arguments concatenated), so a
 * tool-call answer survives the fold. A body with no decodable frame is an upstream protocol error,
 * never an empty answer.
 */
export function completionFromSse(body: string): CompletionResponse {
  let first: StreamChunk | undefined;
  let content = "";
  let finish: string | null = null;
  let usage: CompletionResponse["usage"];
  const toolCalls: Array<{ id?: string; type: string; function: { name: string; arguments: string } }> = [];
  let wholeToolCalls: unknown[] | undefined;
  for (const raw of body.split("\n")) {
    const parsed = parseSseLine(raw);
    if (parsed === undefined || parsed === DONE) continue;
    const chunk = parsed as StreamChunk;
    first ??= chunk;
    const choice = chunk.choices?.[0];
    content += choice?.delta?.content ?? choice?.message?.content ?? "";
    for (const d of choice?.delta?.tool_calls ?? []) {
      const i = typeof d.index === "number" ? d.index : toolCalls.length;
      const slot = (toolCalls[i] ??= { type: "function", function: { name: "", arguments: "" } });
      if (d.id) slot.id = d.id;
      if (d.type) slot.type = d.type;
      if (d.function?.name) slot.function.name += d.function.name;
      if (d.function?.arguments) slot.function.arguments += d.function.arguments;
    }
    if (Array.isArray(choice?.message?.tool_calls)) wholeToolCalls = choice.message.tool_calls;
    if (choice?.finish_reason) finish = choice.finish_reason;
    if (chunk.usage) usage = chunk.usage;
  }
  if (!first) {
    throw new RuntimeError("complete: upstream answered text/event-stream with no decodable completion frame");
  }
  const merged = wholeToolCalls ?? toolCalls.filter(Boolean);
  return {
    id: first.id ?? "",
    object: "chat.completion",
    created: first.created ?? 0,
    model: first.model ?? "",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content, ...(merged.length ? { tool_calls: merged } : {}) },
        finish_reason: finish,
      },
    ],
    ...(usage ? { usage } : {}),
  };
}

export class RuntimeClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: RuntimeClientOptions) {
    this.baseUrl = stripTrailingSlashes(opts.baseUrl);
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json", ...extra };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  /** List the models the door serves. Sends the token when one is set (the gateway requires it). */
  async models(): Promise<string[]> {
    const res = await this.fetchImpl(`${this.baseUrl}/models`, { headers: this.headers() });
    if (!res.ok) throw await upstreamError("models", res, this.token);
    const body = (await res.json()) as { data?: { id: string }[] };
    return (body.data ?? []).map((m) => m.id);
  }

  /** One non-streaming chat completion. */
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ stream: false, ...req }),
    });
    if (!res.ok) throw await upstreamError("complete", res, this.token);
    if ((res.headers.get("content-type") ?? "").includes("text/event-stream")) {
      return completionFromSse(await res.text());
    }
    return (await res.json()) as CompletionResponse;
  }

  /** Stream a completion as SSE `data:` chunks, yielding each parsed delta. */
  async *stream(req: CompletionRequest): AsyncGenerator<Record<string, unknown>, void, void> {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers({ accept: "text/event-stream" }),
      // include_usage defaults to true even when the caller passes other stream_options: the
      // gateway rejects a stream without it (usage_accounting_required). An explicit false is kept.
      body: JSON.stringify({
        stream: true,
        ...req,
        stream_options: { include_usage: true, ...req.stream_options },
      }),
    });
    if (!res.ok) throw await upstreamError("stream", res, this.token);
    if (!res.body) throw new RuntimeError(`stream: upstream ${res.status} sent no body`, res.status);

    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const parsed = parseSseLine(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 1);
        if (parsed === DONE) return;
        // Comments, keep-alives and malformed or partial frames come back undefined and are skipped.
        if (parsed !== undefined) yield parsed;
      }
    }
  }
}
