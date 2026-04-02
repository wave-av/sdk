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

// Use dynamic import approach so @opentelemetry/api is only loaded when enabled.
// This ensures tree-shaking removes the entire module when telemetry is not used.

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
 * Minimal tracer interface matching @opentelemetry/api Tracer.
 * Using a structural type so the module works without importing OTEL at compile time.
 */
interface OtelSpan {
  setAttribute(key: string, value: string | number | boolean): OtelSpan;
  setStatus(status: { code: number; message?: string }): OtelSpan;
  end(): void;
}

interface OtelTracer {
  startSpan(name: string): OtelSpan;
}

interface OtelTraceApi {
  getTracer(name: string, version?: string): OtelTracer;
}

/** SpanStatusCode values from @opentelemetry/api */
const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;

/**
 * Internal telemetry state. Holds the resolved tracer once enabled.
 */
let resolvedTracer: OtelTracer | null = null;
let telemetryEnabled = false;

/**
 * Initialize telemetry. Call once during SDK client construction.
 * If @opentelemetry/api is not installed, telemetry silently remains disabled.
 */
export function initTelemetry(config: TelemetryConfig): void {
  if (!config.enabled) {
    telemetryEnabled = false;
    resolvedTracer = null;
    return;
  }

  try {
    // Attempt to resolve @opentelemetry/api at runtime.
    // This is a peer dependency - if not installed, we gracefully disable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const otelApi = require('@opentelemetry/api') as { trace: OtelTraceApi };
    const serviceName = config.serviceName ?? '@wave/sdk';
    resolvedTracer = otelApi.trace.getTracer(serviceName, '2.0.0');
    telemetryEnabled = true;
  } catch {
    // @opentelemetry/api not installed - telemetry stays disabled
    telemetryEnabled = false;
    resolvedTracer = null;
  }
}

/**
 * Reset telemetry state. Useful for testing or teardown.
 */
export function resetTelemetry(): void {
  telemetryEnabled = false;
  resolvedTracer = null;
}

/**
 * Check if telemetry is currently enabled.
 */
export function isTelemetryEnabled(): boolean {
  return telemetryEnabled;
}

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
export async function withTelemetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  // Fast path: no overhead when disabled
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }

  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();

  try {
    // Set user-provided attributes (pre-validated: no PII fields)
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }

    const result = await fn();

    const durationMs = performance.now() - startTime;
    span.setAttribute('wave.sdk.method', operationName);
    span.setAttribute('wave.sdk.duration_ms', Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();

    return result;
  } catch (error: unknown) {
    const durationMs = performance.now() - startTime;
    span.setAttribute('wave.sdk.method', operationName);
    span.setAttribute('wave.sdk.duration_ms', Math.round(durationMs));

    // Record error type only (class name), never the message (may contain PII)
    const errorType =
      error instanceof Error ? error.constructor.name : 'UnknownError';
    span.setAttribute('wave.sdk.error_type', errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();

    throw error;
  }
}

/**
 * Synchronous version of withTelemetry for non-async operations.
 * Same zero-overhead behavior when disabled.
 */
export function withTelemetrySync<T>(
  operationName: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }

  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();

  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }

    const result = fn();

    const durationMs = performance.now() - startTime;
    span.setAttribute('wave.sdk.method', operationName);
    span.setAttribute('wave.sdk.duration_ms', Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();

    return result;
  } catch (error: unknown) {
    const durationMs = performance.now() - startTime;
    span.setAttribute('wave.sdk.method', operationName);
    span.setAttribute('wave.sdk.duration_ms', Math.round(durationMs));

    const errorType =
      error instanceof Error ? error.constructor.name : 'UnknownError';
    span.setAttribute('wave.sdk.error_type', errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();

    throw error;
  }
}

