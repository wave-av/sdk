/**
 * WAVE SDK - Meter API
 *
 * Read-only metering surface: the ledger (one window, per-channel usage) and rollup
 * (aggregated totals over a period) for the comms productization planes.
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
  MeterTier,
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
 * console.log(`${ledger.from} → ${ledger.to}: ${ledger.channels.mail?.ops ?? 0} mail ops`);
 *
 * const rollup = await wave.meter.rollup({ period: "month" });
 * console.log(`Mail USDC this month: ${rollup.totals.mail.usdc}`);
 * ```
 */
export class MeterAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/meter";
  constructor(client: WaveClient) {
    this.client = client;
  }

  /** Fetch the ledger for one window (default: today, UTC), optionally narrowed to one channel. */
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
