/**
 * WAVE SDK - Meter Types
 *
 * Types for the metering ledger and rollup surfaces. Shapes mirror the gateway's public v0
 * contract (wave-gateway src/meter-ledger.ts `MeterLedger` and src/meter-rollup.ts `MeterRollup`),
 * which is additive-only: fields may be added as new channels land, never removed or retyped.
 *
 * `blocked`, where present, is a machine-readable reason a source could not be counted (for example
 * `"a2p-unregistered"` or `"usage_unconfigured"`), never a count. A blocked channel still reports 0
 * for its numbers.
 */

/** Mail usage in the window. */
export interface MeterMailChannel {
  /** Number of email operations. */
  ops: number;
  /** USDC settled for this channel window (decimal string). */
  usdc: string;
  /** Number of failed/error operations. */
  errors: number;
  /** Why the source could not be counted, when it could not. */
  blocked?: string;
}

/** Voice usage in the window. */
export interface MeterVoiceChannel {
  /** Minutes consumed. */
  minutes: number;
  /** USDC settled for voice usage (decimal string). */
  usdc: string;
  /** Why the source could not be counted, when it could not. */
  blocked?: string;
}

/** SMS usage in the window. */
export interface MeterSmsChannel {
  /** Number of SMS operations. */
  ops: number;
  /** Why SMS could not be counted or sent (e.g. `"a2p-unregistered"`). Always present. */
  blocked: string;
}

/** Realtime-plane usage in the window. */
export interface MeterRealtimeChannel {
  /** Minutes consumed on the realtime plane. */
  minutes: number;
  /** Why the source could not be counted, when it could not. */
  blocked?: string;
}

/** Storage usage in the window. */
export interface MeterStorageChannel {
  /** Bytes stored. */
  bytes: number;
  /** Why the source could not be counted, when it could not. */
  blocked?: string;
}

/** Every channel the meter reports. */
export interface MeterChannels {
  mail: MeterMailChannel;
  voice: MeterVoiceChannel;
  sms: MeterSmsChannel;
  realtime: MeterRealtimeChannel;
  storage: MeterStorageChannel;
}

/** The caller's platform tier, when the org has one (absent for free orgs). */
export interface MeterTier {
  id: string;
  discount_pct: number;
  monthly_credit_usd_micros: number;
  /** Remaining credit balance in USD micros; null when the balance could not be read. */
  credit_balance_usd_micros: number | null;
}

/**
 * Response from {@link MeterAPI.ledger}: one window for the caller's org. `channels` holds every
 * channel, or only the one named by `?channel=`.
 */
export interface MeterLedger {
  /** Organization id that owns this ledger. */
  org: string;
  /** Start of the window (ISO 8601). */
  from: string;
  /** End of the window (ISO 8601). */
  to: string;
  /** Per-channel usage. Partial because `?channel=` narrows it to one channel. */
  channels: Partial<MeterChannels>;
  /** When this ledger was generated (ISO 8601). */
  generated_at: string;
  /** The caller's platform tier, when the org has one. */
  tier?: MeterTier;
}

/**
 * @deprecated Before 3.0.0 the SDK typed the ledger as `{ rows: MeterLedgerRow[] }`, a shape the
 * gateway never returned. The ledger is a single window; use {@link MeterLedger}.
 */
export type MeterLedgerRow = Pick<MeterLedger, "org" | "from" | "to" | "channels">;

/** Aggregated totals across a rollup window. Every channel is always present. */
export type MeterRollupTotals = MeterChannels;

/** Response from {@link MeterAPI.rollup}. */
export interface MeterRollup {
  /** Organization id. */
  org: string;
  /** Start of the rollup window (ISO 8601). */
  from: string;
  /** End of the rollup window (ISO 8601). */
  to: string;
  /** The aggregation period the window covers. */
  period: "month" | "week" | "day";
  /** Aggregated channel totals. */
  totals: MeterRollupTotals;
  /** When this rollup was generated (ISO 8601). */
  generated_at: string;
}
