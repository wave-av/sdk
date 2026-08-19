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
      body: JSON.stringify({ stream: false, ...req }),
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
      body: JSON.stringify({ stream: true, ...req }),
    });
    if (!res.ok || !res.body) throw new RuntimeError(`stream: upstream ${res.status}`, res.status);

    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          yield JSON.parse(payload);
        } catch {
          // skip malformed keep-alive / partial frames
        }
      }
    }
  }
}
