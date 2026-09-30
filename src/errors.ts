/**
 * WAVE SDK - error model.
 *
 * WaveError and its subclasses, plus the parser that turns any gateway error body into one.
 * Re-exported from './client' so existing imports keep working.
 */

// Error codes that signal a transient transport/throttling condition and are
// safe to retry, independent of HTTP status. Module-level so the Set is
// allocated once rather than on every isRetryable call.
const RETRYABLE_ERROR_CODES = new Set([
  'RATE_LIMITED',
  'TIMEOUT',
  'NETWORK_ERROR',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

/**
 * WAVE SDK Error class
 */
export class WaveError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    requestId?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WaveError';
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.details = details;
    this.retryable = this.isRetryable(statusCode, code);
  }

  /**
   * Determine whether an error is safe to retry.
   *
   * Conservative by design: only transient, server-side or throttling
   * conditions are retryable. Client errors (4xx other than 408/429) are
   * treated as permanent so we never re-issue a request the server has
   * already rejected on its merits (e.g. 400/401/403/404).
   */
  private isRetryable(statusCode: number, code: string): boolean {
    // Server errors are transient and retryable.
    if (statusCode >= 500) {
      return true;
    }

    // Throttling (429) and request timeout (408) are retryable.
    if (statusCode === 429 || statusCode === 408) {
      return true;
    }

    // statusCode 0 indicates a network/transport-level failure (no HTTP
    // response was received) — these are retryable.
    if (statusCode === 0) {
      return true;
    }

    // Code-based retryable signals for transport/throttling conditions that
    // may surface without a conventional retryable status code.
    if (RETRYABLE_ERROR_CODES.has(code)) {
      return true;
    }

    return false;
  }

}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends WaveError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, requestId?: string) {
    super(message, 'RATE_LIMITED', 429, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * HTTP 402. Two gateway causes share this status:
 * - the organization's spend cap blocks the call (`code` is e.g. `SPEND_CAP_TIER_BLOCKED`;
 *   the message says what to do, e.g. add a payment method), or
 * - the route is priced per call over x402 and no payment or key was presented (`code` is
 *   `PAYMENT_REQUIRED`; `accepts` carries the x402 payment requirements).
 *
 * A 402 proves the route is priced. It does not prove the route is served.
 */
export class PaymentRequiredError extends WaveError {
  /** x402 payment requirements from the challenge body, when the gateway sent one. */
  public readonly accepts?: unknown[];
  /** x402 protocol version from the challenge body, when present. */
  public readonly x402Version?: number;

  constructor(message: string, code: string, requestId?: string, details?: Record<string, unknown>) {
    super(message, code, 402, requestId, details);
    this.name = 'PaymentRequiredError';
    if (Array.isArray(details?.accepts)) this.accepts = details.accepts as unknown[];
    if (typeof details?.x402Version === 'number') this.x402Version = details.x402Version;
  }
}

/**
 * The gateway serves nothing at this path and method (404 `ROUTE_NOT_FOUND` or
 * `ROUTE_NOT_MAPPED`), or the SDK knows before calling that no route exists
 * (`ROUTE_NOT_SERVED`). Several SDK modules are typed ahead of their backend; this is the
 * error they raise until the backend ships. The capability index at
 * https://gateway.wave.online/.well-known/wave-skills.json lists every callable route.
 */
export class RouteNotServedError extends WaveError {
  constructor(message: string, code: string, requestId?: string, details?: Record<string, unknown>) {
    super(message, code, 404, requestId, details);
    this.name = 'RouteNotServedError';
  }
}

const ROUTE_NOT_SERVED_CODES = new Set(['ROUTE_NOT_FOUND', 'ROUTE_NOT_MAPPED', 'ROUTE_NOT_SERVED']);

/**
 * Error-body fields copied into `WaveError.details`, besides the envelope's own `error.details`
 * object. An allowlist on purpose: from the rest of the body the SDK surfaces the fields the
 * gateway documents as actionable and drops anything else it may carry. `error.details` itself
 * is the envelope's documented details channel (see WaveAPIErrorResponse) and passes through
 * whole, exactly as it did before these other envelopes were parsed.
 */
const ERROR_DETAIL_FIELDS = [
  'error',
  'param',
  'required_scope',
  'available_scopes',
  'suggestions',
  'did_you_mean',
  'next_action',
  'doc_url',
  'x402Version',
  'accepts',
] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function pickDetails(
  source: Record<string, unknown>,
  into: Record<string, unknown>,
  skip: ReadonlySet<string> = new Set(),
): void {
  for (const field of ERROR_DETAIL_FIELDS) {
    if (!skip.has(field) && source[field] !== undefined) into[field] = source[field];
  }
}

/** In the nested envelope `error` is the envelope itself, so it is never a detail to copy. */
const NESTED_SKIP: ReadonlySet<string> = new Set(['error']);

/** Parsed form of any gateway error body. */
export interface ParsedErrorBody {
  code?: string;
  message?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

/**
 * Read a gateway error body. The gateway emits three shapes, and all three are handled:
 * - nested:  `{ error: { code, message, details?, request_id?, ... } }` (401/403/404/400)
 * - flat:    `{ error: "spend_cap_exceeded", code, message, ... }` (402 spend cap, 426)
 * - x402:    `{ x402Version, error: "payment required", accepts: [...] }` (402 priced route)
 */
export function parseErrorBody(body: unknown): ParsedErrorBody {
  if (!isRecord(body)) return {};
  const details: Record<string, unknown> = {};
  const out: ParsedErrorBody = {};
  const err = body.error;

  if (isRecord(err)) {
    out.code = nonEmptyString(err.code);
    out.message = nonEmptyString(err.message);
    out.requestId = nonEmptyString(err.request_id) ?? nonEmptyString(body.request_id);
    if (isRecord(err.details)) Object.assign(details, err.details);
    pickDetails(err, details, NESTED_SKIP);
  } else {
    const isX402 = body.x402Version !== undefined || Array.isArray(body.accepts);
    const errString = nonEmptyString(err);
    out.code =
      nonEmptyString(body.code) ??
      (isX402 ? 'PAYMENT_REQUIRED' : errString && /^[A-Za-z0-9_.-]+$/.test(errString) ? errString : undefined);
    out.message =
      nonEmptyString(body.message) ??
      (isX402 ? 'Payment required: this route is priced per call over x402' : errString);
    out.requestId = nonEmptyString(body.request_id);
    pickDetails(body, details);
  }

  if (Object.keys(details).length > 0) out.details = details;
  return out;
}

/** Build the most specific WaveError subclass for a status + code. */
export function createWaveError(
  message: string,
  code: string,
  statusCode: number,
  requestId?: string,
  details?: Record<string, unknown>
): WaveError {
  if (statusCode === 402) {
    return new PaymentRequiredError(message, code, requestId, details);
  }
  if (statusCode === 404 && ROUTE_NOT_SERVED_CODES.has(code)) {
    return new RouteNotServedError(message, code, requestId, details);
  }
  return new WaveError(message, code, statusCode, requestId, details);
}
