/**
 * WAVE SDK - Meter Types
 *
 * Types for the metering ledger and rollup surfaces. Shapes mirror the live
 * wave-gateway D1 meter tables; fields may be added as new channels land.
 */
/** Per-channel usage in a ledger row. */
interface MeterMailChannel {
    /** Number of email operations. */
    ops: number;
    /** USDC settled for this channel window. */
    usdc: string;
    /** Number of failed/error operations. */
    errors: number;
}
interface MeterVoiceChannel {
    /** Minutes consumed. */
    minutes: number;
    /** USDC settled for voice usage. */
    usdc: string;
}
interface MeterSmsChannel {
    /** Number of SMS operations. */
    ops: number;
    /** Number of blocked operations. */
    blocked: number;
}
interface MeterRealtimeChannel {
    /** Minutes consumed on the realtime plane. */
    minutes: number;
}
interface MeterStorageChannel {
    /** Bytes stored. */
    bytes: number;
}
/** All channel breakdowns within a single ledger row. */
interface MeterChannels {
    mail: MeterMailChannel;
    voice: MeterVoiceChannel;
    sms: MeterSmsChannel;
    realtime: MeterRealtimeChannel;
    storage: MeterStorageChannel;
}
/** A single ledger row — one billing window for an org. */
interface MeterLedgerRow {
    /** Organization id that owns this meter row. */
    org: string;
    /** Start of the billing window (ISO 8601). */
    from: string;
    /** End of the billing window (ISO 8601). */
    to: string;
    /** Per-channel usage breakdown. */
    channels: MeterChannels;
}
/** Response from {@link MeterAPI.ledger}. */
interface MeterLedger {
    /** Array of ledger rows matching the query window. */
    rows: MeterLedgerRow[];
    /** When this ledger snapshot was generated (ISO 8601). */
    generated_at: string;
}
/** Aggregated totals across a rollup window. */
interface MeterRollupTotals {
    mail: MeterMailChannel;
    voice: MeterVoiceChannel;
    sms: MeterSmsChannel;
    realtime: MeterRealtimeChannel;
    storage: MeterStorageChannel;
}
/** Response from {@link MeterAPI.rollup}. */
interface MeterRollup {
    /** Organization id. */
    org: string;
    /** Start of the rollup window (ISO 8601). */
    from: string;
    /** End of the rollup window (ISO 8601). */
    to: string;
    /** Aggregated channel totals. */
    totals: MeterRollupTotals;
    /** When this rollup was generated (ISO 8601). */
    generated_at: string;
}

export type { MeterChannels, MeterLedger, MeterLedgerRow, MeterMailChannel, MeterRealtimeChannel, MeterRollup, MeterRollupTotals, MeterSmsChannel, MeterStorageChannel, MeterVoiceChannel };
