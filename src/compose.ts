/**
 * WAVE SDK - Composer (`@wave-av/sdk/compose`)
 *
 * `compose()` calls `POST /v1/compose` on the WAVE gateway (`api.wave.online`) and returns
 * the typed proposal: a plan (stages, scopes, price rows, the http/mcp call shape) that the
 * Composer NEVER executes — `executes` is a literal `false` on every response. `saveFlow()`
 * posts an already-composed proposal to the console flows door so it can be re-read and
 * re-proposed later (`flowId`).
 *
 * These functions are STANDALONE (no `Wave` client instance required), matching this
 * package's `agent-auth.ts` convention: pass `apiKey`/`baseUrl`/`fetchImpl` per call, or reuse
 * a `WaveClient`'s `post()` if you already have one (see `README.md`).
 */

import type { ComposeProposal, ComposeRequest } from "./compose-types";

export type {
  ComposeRequest,
  ComposeProposal,
  ComposeStage,
  ComposeScopeRow,
  QuotedPriceRow,
  UnquotedPriceRow,
  ComposePriceRow,
  ComposeCallShape,
  ComposeEngineRoute,
  ComposeEngineInfo,
} from "./compose-types";
export { COMPOSE_PROPOSAL_METER, QUOTE_AT_CALL_TIME, isQuotedPriceRow } from "./compose-types";

const DEFAULT_BASE = "https://api.wave.online";
/** Documented today (no live host yet); override with `options.consoleBaseUrl` once it ships. */
const DEFAULT_CONSOLE_BASE = "https://console.wave.online";

/** The gateway's `{ error: { code, message? } }` envelope, passed through verbatim. */
export interface ComposeErrorBody {
  error?: { code?: string; message?: string } | string;
}

/** A non-2xx response from `POST /v1/compose` or `GET /v1/compose/proposals/:id`. */
export class ComposeError extends Error {
  /** The gateway's error code (e.g. `BAD_REQUEST`, `AUTH_REQUIRED`, `SCOPE_INSUFFICIENT`), when present. */
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ComposeError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Thrown by `saveFlow()` when no console credential is supplied. `POST /api/console/flows` is
 * session-cookie-auth only until the `composer:write`-scoped console token ships (PR4 brief
 * §5 item 3); rather than a silent no-op, this carries the exact `curl` a signed-in human can
 * paste in the console to save the flow by hand.
 */
export class ConsoleAuthRequiredError extends Error {
  /** The equivalent request a signed-in human can run from the console. */
  curl: string;

  constructor(curl: string) {
    super(
      "saveFlow() has no console credential: POST /api/console/flows is session-cookie-auth " +
        "only until the composer:write-scoped console token ships. Paste this curl from a " +
        "signed-in console session instead:\n" +
        curl,
    );
    this.name = "ConsoleAuthRequiredError";
    this.curl = curl;
  }
}

export interface ComposeOptions {
  /** Re-propose a previously saved flow (server re-checks it against today's manifests). */
  flowId?: string;
  /** Caps the proposal's price rows (server-enforced, optional). */
  budgetUsd?: number;
  /** A key with the `composer:write` scope. Required until the no-key x402 lane ships (OWED). */
  apiKey?: string;
  /** Gateway base URL. Default: `https://api.wave.online`. */
  baseUrl?: string;
  /** fetch implementation (tests inject a mock). */
  fetchImpl?: typeof fetch;
}

export interface SaveFlowOptions {
  /** A `composer:write`-scoped console token (not yet issued anywhere; OWED, brief §5 item 3). */
  consoleToken?: string;
  /** Console base URL. Default: `https://console.wave.online`. */
  consoleBaseUrl?: string;
  /** fetch implementation (tests inject a mock). */
  fetchImpl?: typeof fetch;
}

/** `POST /api/console/flows` response (brief §5). */
export interface SaveFlowResult {
  flowId: string;
}

async function parseErrorBody(res: Response): Promise<{ message: string; code?: string }> {
  const text = await res.text();
  let json: ComposeErrorBody | undefined;
  try {
    json = JSON.parse(text) as ComposeErrorBody;
  } catch {
    return { message: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  const e = json?.error;
  if (typeof e === "string") return { message: e, code: e };
  if (e && typeof e === "object") return { message: e.message ?? e.code ?? `HTTP ${res.status}`, code: e.code };
  return { message: `HTTP ${res.status}` };
}

/**
 * Compose a plan for an intent. Calls `POST /v1/compose`, and only that route: the response's
 * `executes` field is always `false` — nothing this function calls ever performs a product
 * action.
 * @example
 * const proposal = await compose("live captions for tomorrow's webinar", { apiKey: process.env.WAVE_API_KEY });
 * console.log(proposal.stages.map((s) => s.why));
 */
export async function compose(intent: string, options: ComposeOptions = {}): Promise<ComposeProposal> {
  const base = options.baseUrl ?? DEFAULT_BASE;
  const f = options.fetchImpl ?? fetch;
  const body: ComposeRequest = { intent };
  if (options.budgetUsd !== undefined) body.budgetUsd = options.budgetUsd;
  if (options.flowId !== undefined) body.flowId = options.flowId;

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.apiKey) headers.authorization = `Bearer ${options.apiKey}`;

  const res = await f(`${base}/v1/compose`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { message, code } = await parseErrorBody(res);
    throw new ComposeError(message, res.status, code);
  }
  return (await res.json()) as ComposeProposal;
}

function saveFlowCurl(proposal: ComposeProposal, consoleBaseUrl: string): string {
  const payload = JSON.stringify(
    {
      createdBy: { kind: "wave-composer" },
      manifestHash: proposal.manifestHash,
      groundedAt: proposal.groundedAt,
      proposal,
    },
    null,
    2,
  );
  return (
    `curl -X POST ${consoleBaseUrl}/api/console/flows \\\n` +
    `  -H "content-type: application/json" \\\n` +
    `  --cookie "<your console session cookie>" \\\n` +
    `  -d '${payload}'`
  );
}

/**
 * Save a composed proposal as a flow via the console flows door (`POST /api/console/flows`,
 * brief §5), stamping `createdBy.kind: "wave-composer"`. The gateway never writes the flow;
 * the console route is the one write path. `POST /v1/compose` is never called again here.
 *
 * `/api/console/flows` is session-cookie-auth only until the `composer:write`-scoped console
 * token ships (OWED, brief §5 item 3): without `options.consoleToken`, this throws
 * `ConsoleAuthRequiredError` carrying the exact curl to run from a signed-in console — never a
 * silent no-op.
 */
export async function saveFlow(proposal: ComposeProposal, options: SaveFlowOptions = {}): Promise<SaveFlowResult> {
  const consoleBaseUrl = options.consoleBaseUrl ?? DEFAULT_CONSOLE_BASE;
  if (!options.consoleToken) {
    throw new ConsoleAuthRequiredError(saveFlowCurl(proposal, consoleBaseUrl));
  }
  const f = options.fetchImpl ?? fetch;
  const res = await f(`${consoleBaseUrl}/api/console/flows`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.consoleToken}`,
    },
    body: JSON.stringify({
      createdBy: { kind: "wave-composer" },
      manifestHash: proposal.manifestHash,
      groundedAt: proposal.groundedAt,
      proposal,
    }),
  });
  if (!res.ok) {
    const { message, code } = await parseErrorBody(res);
    throw new ComposeError(message, res.status, code);
  }
  return (await res.json()) as SaveFlowResult;
}
