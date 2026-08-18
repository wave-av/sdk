/**
 * WAVE Runtime API client — the OpenAI-compatible runtime door.
 *
 * API-first foundation for the "any harness, one WAVE runtime" surface: `runtime.wave.online/v1`
 * (canonical) / `dsh.wave.online/v1` (alias), served by wave-runtime-spoke → gateway → provider star.
 * This module is the thin typed client the `wave` CLI and the wave-runtime MCP server both call, so
 * the door's contract lives in exactly one place. Bearer-token auth (the door is key-gated on
 * completions; the models list is open). Standalone — deliberately not coupled to WaveClient's
 * API-key auth, since the door uses a different credential axis (DISPATCH_PROOF_BEARER / per-user key).
 */

export interface ToolSpec {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface SystemMessage {
  role: "system";
  content: string;
}

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface ToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

export interface CompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  tools?: ToolSpec[];
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionChoice {
  index: number;
  message: AssistantMessage;
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
  /** Base URL of the runtime door, e.g. https://runtime.wave.online/v1 */
  baseUrl: string;
  /** Bearer token for completion auth (models list is open; completions are gated). */
  token?: string;
  fetchImpl?: typeof fetch;
}

export class RuntimeError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export class RuntimeClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: RuntimeClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(extra: Record<string, string> = {}, auth = true): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json", ...extra };
    if (auth && this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  /** List the models the door serves (open — no auth required). */
  async models(): Promise<string[]> {
    const res = await this.fetchImpl(`${this.baseUrl}/models`, { headers: this.headers({}, false) });
    if (!res.ok) throw new RuntimeError(`models: upstream ${res.status}`, res.status);
    const body = (await res.json()) as { data?: { id: string }[] };
    return (body.data ?? []).map((m) => m.id);
  }

  /** One non-streaming chat completion. */
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ ...req, stream: false }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new RuntimeError(`complete: upstream ${res.status}${text ? ` (${text.slice(0, 120)})` : ""}`, res.status);
    }
    return (await res.json()) as CompletionResponse;
  }

  /** Stream a completion as SSE `data:` chunks, yielding each parsed delta. */
  async *stream(req: CompletionRequest): AsyncGenerator<Record<string, unknown>, void, void> {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers({ accept: "text/event-stream" }),
      body: JSON.stringify({ ...req, stream: true }),
    });
    if (!res.ok || !res.body) throw new RuntimeError(`stream: upstream ${res.status}`, res.status);

    const decoder = new TextDecoder();
    let buffer = "";
    let eventData: string | undefined;
    let done = false;

    const completeEvent = (): string | undefined => {
      const payload = eventData;
      eventData = undefined;
      return payload;
    };

    const parseLine = (line: string): string | undefined => {
      if (line === "") return completeEvent();
      if (!line.startsWith("data:")) return undefined;
      const value = line.slice(5).replace(/^ /, "");
      eventData = eventData === undefined ? value : `${eventData}\n${value}`;
      return undefined;
    };

    const emit = (payload: string | undefined): Record<string, unknown> | undefined => {
      if (payload === undefined) return undefined;
      const value = payload.trim();
      if (value === "[DONE]") {
        done = true;
        return undefined;
      }
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        throw new RuntimeError(`stream: invalid SSE JSON data (${value.slice(0, 120)})`);
      }
    };

    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      while (true) {
        const lf = buffer.indexOf("\n");
        const cr = buffer.indexOf("\r");
        const idx = lf < 0 ? cr : cr < 0 ? lf : Math.min(lf, cr);
        if (idx < 0) break;
        const delimiterLength = buffer[idx] === "\r" && buffer[idx + 1] === "\n" ? 2 : 1;
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + delimiterLength);
        const value = emit(parseLine(line));
        if (value !== undefined) yield value;
        if (done) return;
      }
    }

    buffer += decoder.decode();
    if (buffer.length > 0) {
      const value = emit(parseLine(buffer));
      if (value !== undefined) yield value;
    }
    const value = emit(completeEvent());
    if (value !== undefined) yield value;
  }
}
