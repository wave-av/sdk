import { stripTrailingSlashes } from './url-util';
/**
 * WAVE Automations client — the SDK rung for the event-trigger fabric.
 *
 * Wraps the public webhook endpoint (automations.wave.online, a Cloudflare Tunnel → local dispatch
 * server): POST an event; the server matches it against every `trigger:`-bearing registry job and
 * dispatches the winners under their bounds. The endpoint returns the dispatch result (matched ids).
 */
export interface AutomationDispatchResult {
  matched: string[];
  dispatched: { id: string; status: number; stdout: string; stderr: string }[];
}

export interface AutomationsClientOptions {
  /** Public webhook endpoint, e.g. https://automations.wave.online */
  endpoint: string;
  fetchImpl?: typeof fetch;
}

export class AutomationsClient {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: AutomationsClientOptions) {
    this.endpoint = stripTrailingSlashes(opts.endpoint);
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Dispatch an event to the webhook plane. Returns the matched job ids + dispatch results.
   * A non-2xx or malformed response throws; a 200 with `{ matched: [] }` is a clean no-match.
   */
  async dispatch(event: Record<string, unknown>): Promise<AutomationDispatchResult> {
    const res = await this.fetchImpl(`${this.endpoint}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`automations: upstream ${res.status}`);
    return (await res.json()) as AutomationDispatchResult;
  }
}
