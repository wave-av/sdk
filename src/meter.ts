/**
 * WAVE SDK - Meter API
 *
 * Read-only metering surface: the ledger (per-window rows) and rollup (aggregated
 * totals) for the comms productization planes.
 *
 * Requires scope `meter:read`. Auth, scope, and entitlement are enforced
 * server-side; the SDK only forwards your API key.
 */

import type { WaveClient } from "./client";
import type {
  MeterLedger,
  MeterRollup,
} from "./meter-types";

export type {
  MeterLedger,
  MeterLedgerRow,
  MeterChannels,
  MeterMailChannel,
  MeterVoiceChannel,
  MeterSmsChannel,
  MeterRealtimeChannel,
  MeterStorageChannel,
  MeterRollup,
  MeterRollupTotals,
} from "./meter-types";

/** Parameters for {@link MeterAPI.ledger}. */
export interface LedgerParams {
  /** Start of the query window (ISO 8601). */
  from?: string;
  /** End of the query window (ISO 8601). */
  to?: string;
  /** Restrict to a single channel. */
  channel?: "mail" | "voice" | "sms" | "realtime" | "storage";
}

/** Parameters for {@link MeterAPI.rollup}. */
export interface RollupParams {
  /** Start of the query window (ISO 8601). */
  from?: string;
  /** End of the query window (ISO 8601). */
  to?: string;
  /** Aggregation period. */
  period?: "month" | "week" | "day";
}

/**
 * Meter API — read the org's usage ledger and rollup aggregates.
 *
 * @requires scope `meter:read`
 *
 * @example
 * ```typescript
 * const ledger = await wave.meter.ledger({ channel: "mail" });
 * for (const row of ledger.rows) {
 *   console.log(`${row.from} → ${row.to}: ${row.channels.mail.ops} ops`);
 * }
 *
 * const rollup = await wave.meter.rollup({ period: "month" });
 * console.log(`Total USDC: ${rollup.totals.mail.usdc}`);
 * ```
 */
export class MeterAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/meter";
  constructor(client: WaveClient) {
    this.client = client;
  }

  /** Fetch ledger rows for the given time window and optional channel filter. */
  async ledger(params?: LedgerParams): Promise<MeterLedger> {
    return this.client.get<MeterLedger>(`${this.basePath}/ledger`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /** Fetch aggregated rollup totals for the given period. */
  async rollup(params?: RollupParams): Promise<MeterRollup> {
    return this.client.get<MeterRollup>(`${this.basePath}/ledger/rollup`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
}

export function createMeterAPI(client: WaveClient): MeterAPI {
  return new MeterAPI(client);
}
