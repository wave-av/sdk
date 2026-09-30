/**
 * Error-body parsing for WaveClient (internal module; WaveClient.parseErrorResponse is its caller).
 */

import type { WaveAPIErrorResponse } from './client-types';

export interface ParsedErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Read an error body into code/message/details. Canonical: `{error:{code,message,details}}`.
 * Also accepts the flat shape some gateway paths emit (spend-cap 402s, mesh 400s):
 * `{error:"spend_cap_exceeded", code:"SPEND_CAP_TIER_BLOCKED", message:"Add a payment method…"}`,
 * which the nested-only reader turned into a bare `HTTP_402` / "Payment Required".
 */
export function parseErrorBody(body: unknown, statusCode: number, statusText?: string): ParsedErrorBody {
  let code = `HTTP_${statusCode}`;
  let message = statusText || `Request failed with status ${statusCode}`;
  let details: Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') return { code, message };

  const b = body as Record<string, unknown>;
  const err = b['error'];
  if (err && typeof err === 'object') {
    const e = err as Partial<WaveAPIErrorResponse['error']>;
    code = e.code || code;
    message = e.message || message;
    details = e.details;
  } else {
    const flatCode = typeof b['code'] === 'string' ? b['code'] : undefined;
    const flatMessage = typeof b['message'] === 'string' ? b['message'] : undefined;
    const errString = typeof err === 'string' ? err : undefined;
    // A slug ("spend_cap_exceeded") can stand in for a code; a sentence only for a message.
    const errSlug = errString && /^[A-Za-z0-9_.-]+$/.test(errString) ? errString : undefined;
    code = flatCode || errSlug || code;
    message = flatMessage || errString || message;
    const { error: _e, code: _c, message: _m, request_id: _r, ...rest } = b;
    if (errString && flatCode) rest['error'] = errString;
    details = Object.keys(rest).length ? rest : undefined;
  }
  const requestId = typeof b['request_id'] === 'string' ? b['request_id'] : undefined;
  return { code, message, details, requestId };
}
