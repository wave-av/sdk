/**
 * WAVE SDK - Composer wire contract types.
 *
 * These interfaces are copied VERBATIM from the gateway's `POST /v1/compose` contract
 * (`src/compose-types.ts` on the gateway's `feat/compose-engine` branch, head commit
 * `882ae75d7b1b5370a5e652b80fa0e1f6d06c1825`) — not hand-derived — so the SDK cannot
 * silently drift from what the gateway actually validates: `POST /v1/compose` and
 * `api.wave.online`. Every interface, its field order, and its optionality are unchanged
 * from that source. The one addition, `isQuotedPriceRow()`, is not in the gateway source; it
 * mirrors the same helper `wave-av/cli` PR #61 defines locally against the identical shape
 * (field names cross-checked against that PR's `src/commands/compose/types.ts` at commit
 * `35d9c9ecf15359d5066cfb1958f7ef6fbadb3712`), so the two renderings agree byte-for-byte on
 * the type contract and offer the same discriminator.
 *
 * `executes` is CANON — a literal `false`, never derived, because a proposal is a plan
 * and the Composer never executes one.
 */

/** POST /v1/compose request body. `context` orders retrieval; it is never text the model sees. */
export interface ComposeRequest {
  intent: string;
  budgetUsd?: number;
  flowId?: string;
  context?: { referer?: string };
}

export interface ComposeStage {
  product: string;
  why: string;
}

export interface ComposeScopeRow {
  scope: string;
  mintable: boolean;
  /** Where the mintable fact was read: the open-by-default registry's file:line-ish anchor. */
  source: string;
}

/** A quoted price row: a number ONLY when a live, decodable quote_token backed it. */
export interface QuotedPriceRow {
  product: string;
  meter: string;
  usd: number;
  unit: string;
  quotedAt: number;
  validForS: number;
}

/** An unquoted row: the literal "quote at call time" and the reason the number is absent. */
export interface UnquotedPriceRow {
  product: string;
  meter: string | null;
  quote: "quote at call time";
  reason: string;
}

export type ComposePriceRow = QuotedPriceRow | UnquotedPriceRow;

/** True when a price row carries a live, decodable quote (a `usd` number), never a guess. */
export function isQuotedPriceRow(row: ComposePriceRow): row is QuotedPriceRow {
  return typeof (row as QuotedPriceRow).usd === "number";
}

export interface ComposeCallShape {
  http: string;
  mcp: { tool: string; args: Record<string, unknown> } | null;
}

export type ComposeEngineRoute = "dispatch" | "deterministic-fallback";

export interface ComposeEngineInfo {
  route: ComposeEngineRoute;
  promptHash: string;
  /** null until a SOURCED model catalog exists (brief §9 item 17) — never a name the engine cannot cite. */
  model: null;
}

/** POST /v1/compose response and the stored proposal (§2c). */
export interface ComposeProposal {
  id: string;
  intent: string;
  stages: ComposeStage[];
  productIds: string[];
  tools: string[];
  scopes: ComposeScopeRow[];
  priceRows: ComposePriceRow[];
  callShape: ComposeCallShape;
  next: string[];
  executes: false;
  grounding: "live" | "snapshot";
  groundedAt: string;
  manifestHash: string;
  engine: ComposeEngineInfo;
  flowId: string | null;
}

/** The meter a successful proposal stamps (#1639: free by product decision, counted, never billed). */
export const COMPOSE_PROPOSAL_METER = "wave_compose_proposals";

/** The literal every unquoted price row carries. */
export const QUOTE_AT_CALL_TIME = "quote at call time" as const;
