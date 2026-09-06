import { WaveClient } from './client.js';
import { MeterLedger, MeterRollup } from './meter-types.js';
export { MeterChannels, MeterLedgerRow, MeterMailChannel, MeterRealtimeChannel, MeterRollupTotals, MeterSmsChannel, MeterStorageChannel, MeterVoiceChannel } from './meter-types.js';
import 'eventemitter3';
import './telemetry.js';
import './client-types.js';

/**
 * WAVE SDK - Meter API
 *
 * Read-only metering surface: the ledger (per-window rows) and rollup (aggregated
 * totals) for the comms productization planes.
 *
 * Requires scope `meter:read`. Auth, scope, and entitlement are enforced
 * server-side; the SDK only forwards your API key.
 */

/** Parameters for {@link MeterAPI.ledger}. */
interface LedgerParams {
    /** Start of the query window (ISO 8601). */
    from?: string;
    /** End of the query window (ISO 8601). */
    to?: string;
    /** Restrict to a single channel. */
    channel?: "mail" | "voice" | "sms" | "realtime" | "storage";
}
/** Parameters for {@link MeterAPI.rollup}. */
interface RollupParams {
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
declare class MeterAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /** Fetch ledger rows for the given time window and optional channel filter. */
    ledger(params?: LedgerParams): Promise<MeterLedger>;
    /** Fetch aggregated rollup totals for the given period. */
    rollup(params?: RollupParams): Promise<MeterRollup>;
}
declare function createMeterAPI(client: WaveClient): MeterAPI;

export { type LedgerParams, MeterAPI, MeterLedger, MeterRollup, type RollupParams, createMeterAPI };
