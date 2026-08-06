/**
 * WAVE SDK - Enhance API
 *
 * AI video super-resolution (`POST /v1/enhance`). v1 ships exactly one model, `espcn` (ESPCN — a
 * fixed exact 3x upscale baked into the trained model weights). Requires the `enhance:write`
 * entitlement; unauthenticated calls get an x402 payment challenge (`WaveError` with
 * `statusCode === 402`).
 *
 * The request/response bodies here are raw video bytes, not JSON, so this module bypasses
 * `WaveClient.post()` (which always JSON-encodes) and talks to the API directly — the same
 * `getConnectionInfo()` escape hatch the Realtime plane uses for its own non-JSON transport.
 *
 * NOTE: This is a client SDK. All authorization, entitlement, and billing checks are performed
 * server-side.
 */

import type { WaveClient } from './client';
import { WaveError } from './client';
import type {
  EnhanceModel,
  EnhanceOptions,
  EnhanceReceipt,
  EnhanceResult,
} from './enhance-types';

export * from './enhance-types';

/** Read a required numeric response header, throwing a clear error if the server omitted it. */
function requireNumberHeader(headers: Headers, name: string): number {
  const raw = headers.get(name);
  const value = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(value)) {
    throw new WaveError(`enhance response omitted or sent an invalid ${name} header`, 'ENHANCE_BAD_RECEIPT', 502);
  }
  return value;
}

/** Parse a `WIDTHxHEIGHT` dimensions header (e.g. `672x672`) into `[width, height]`. */
function parseDimensions(headers: Headers, name: string): [number, number] {
  const raw = headers.get(name) ?? '';
  const match = /^(\d+)x(\d+)$/.exec(raw);
  if (!match) {
    throw new WaveError(`enhance response omitted or sent an invalid ${name} header`, 'ENHANCE_BAD_RECEIPT', 502);
  }
  return [Number(match[1]), Number(match[2])];
}

export class EnhanceAPI {
  private readonly apiKey: string;
  private readonly organizationId?: string;
  private readonly baseUrl: string;

  constructor(client: WaveClient) {
    const info = client.getConnectionInfo();
    this.apiKey = info.apiKey;
    this.organizationId = info.organizationId;
    this.baseUrl = info.baseUrl.replace(/\/+$/, '');
  }

  /**
   * Super-resolve a video. Either pass raw video bytes as `video` (with `options.contentType`),
   * or set `options.sourceUrl` to have the server fetch an `https` source instead — set exactly
   * one; when `sourceUrl` is set, `video` is ignored.
   *
   * Resolves to the enhanced video plus the billing/receipt metadata (`x-enhance-*` /
   * `x-wave-usage-minutes` response headers). Throws `WaveError` on a non-2xx response — a
   * `402` means the caller is unauthenticated and must complete the x402 payment challenge
   * (`error.details` carries the challenge) before retrying.
   */
  async enhance(
    video: Blob | ArrayBuffer | Uint8Array | null,
    options: EnhanceOptions = {}
  ): Promise<EnhanceResult> {
    const model: EnhanceModel = options.model ?? 'espcn';
    const url = new URL(`${this.baseUrl}/v1/enhance`);
    url.searchParams.set('model', model);
    if (options.sourceUrl) url.searchParams.set('url', options.sourceUrl);

    const headers: Record<string, string> = { Authorization: `Bearer ${this.apiKey}` };
    if (this.organizationId) headers['x-wave-organization-id'] = this.organizationId;
    if (!options.sourceUrl && options.contentType) headers['content-type'] = options.contentType;

    const body = options.sourceUrl ? undefined : (video ?? undefined);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: body as BodyInit | undefined,
      signal: options.signal,
    });

    if (!res.ok) {
      throw await this.parseError(res);
    }

    const [inputWidth, inputHeight] = parseDimensions(res.headers, 'x-enhance-input-dimensions');
    const [outputWidth, outputHeight] = parseDimensions(res.headers, 'x-enhance-output-dimensions');
    const receipt: EnhanceReceipt = {
      model: (res.headers.get('x-enhance-model') as EnhanceModel | null) ?? model,
      scaleFactor: requireNumberHeader(res.headers, 'x-enhance-scale-factor'),
      inputWidth,
      inputHeight,
      outputWidth,
      outputHeight,
      meter: res.headers.get('x-wave-meter') ?? 'wave_enhance_minutes',
      usageMinutes: requireNumberHeader(res.headers, 'x-wave-usage-minutes'),
    };

    return {
      video: await res.blob(),
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      receipt,
    };
  }

  /** Convenience wrapper for `enhance(null, { ...options, sourceUrl })`. */
  async enhanceFromUrl(sourceUrl: string, options: Omit<EnhanceOptions, 'sourceUrl'> = {}): Promise<EnhanceResult> {
    return this.enhance(null, { ...options, sourceUrl });
  }

  private async parseError(res: Response): Promise<WaveError> {
    const requestId = res.headers.get('x-request-id') || undefined;
    let code = `HTTP_${res.status}`;
    let message = res.statusText || `enhance request failed with status ${res.status}`;
    let details: Record<string, unknown> | undefined;
    try {
      const body = (await res.json()) as { error?: string; detail?: string; error_detail?: { code?: string; message?: string; details?: Record<string, unknown> } };
      if (body?.error_detail) {
        code = body.error_detail.code || code;
        message = body.error_detail.message || message;
        details = body.error_detail.details;
      } else if (body?.error) {
        message = body.error;
        details = body.detail ? { detail: body.detail } : undefined;
      }
    } catch {
      // Non-JSON error body — fall back to the status text above.
    }
    return new WaveError(message, code, res.status, requestId, details);
  }
}

export function createEnhanceAPI(client: WaveClient): EnhanceAPI {
  return new EnhanceAPI(client);
}
