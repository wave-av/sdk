/**
 * WAVE SDK - Optional Telemetry Module
 *
 * Opt-in OpenTelemetry integration for observability of SDK calls.
 * Disabled by default. Zero overhead when not enabled.
 *
 * @example
 * ```typescript
 * import { Wave } from '@wave/sdk';
 *
 * const wave = new Wave({
 *   apiKey: process.env.WAVE_API_KEY!,
 *   telemetry: { enabled: true, serviceName: 'my-app' },
 * });
 * ```
 */
/**
 * Telemetry configuration options.
 * Telemetry is opt-in only and disabled by default.
 */
export interface TelemetryConfig {
    /** Enable telemetry span collection. Default: false */
    enabled: boolean;
    /** Service name reported in spans. Default: '@wave/sdk' */
    serviceName?: string;
}
/**
 * Attributes recorded on telemetry spans.
 * Never includes PII, API keys, or request/response bodies.
 */
export interface TelemetrySpanAttributes {
    /** The SDK method name (e.g., 'clips.list') */
    'wave.sdk.method'?: string;
    /** HTTP status code of the response */
    'wave.sdk.status_code'?: number;
    /** Error type (class name only, never the message) */
    'wave.sdk.error_type'?: string;
    /** Duration of the call in milliseconds */
    'wave.sdk.duration_ms'?: number;
}
/**
 * Initialize telemetry. Call once during SDK client construction.
 * If @opentelemetry/api is not installed, telemetry silently remains disabled.
 */
export declare function initTelemetry(config: TelemetryConfig): void;
/**
 * Reset telemetry state. Useful for testing or teardown.
 */
export declare function resetTelemetry(): void;
/**
 * Check if telemetry is currently enabled.
 */
export declare function isTelemetryEnabled(): boolean;
/**
 * Wrap an async operation with an OpenTelemetry span.
 *
 * When telemetry is disabled, this calls `fn` directly with zero overhead
 * (no span creation, no timing, no try/catch wrapper).
 *
 * Recorded attributes (never PII):
 * - `wave.sdk.method`: operation name
 * - `wave.sdk.duration_ms`: call duration
 * - `wave.sdk.status_code`: HTTP status (if provided in attributes)
 * - `wave.sdk.error_type`: error class name on failure
 *
 * @param operationName - Name of the SDK operation (e.g., 'clips.list')
 * @param fn - The async function to execute
 * @param attributes - Optional span attributes (status code, etc.)
 * @returns The result of `fn`
 */
export declare function withTelemetry<T>(operationName: string, fn: () => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T>;
/**
 * Synchronous version of withTelemetry for non-async operations.
 * Same zero-overhead behavior when disabled.
 */
export declare function withTelemetrySync<T>(operationName: string, fn: () => T, attributes?: Record<string, string | number | boolean>): T;
