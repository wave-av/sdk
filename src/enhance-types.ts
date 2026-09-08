/**
 * WAVE SDK - Enhance API types
 *
 * AI video super-resolution. v1 ships exactly one model, `espcn` (ESPCN — a fixed exact 3x
 * upscale baked into the trained model weights, not a runtime parameter).
 */

/** AI model applied by `POST /v1/enhance`. v1 supports only `espcn`. */
export type EnhanceModel = 'espcn';

/** Options for `EnhanceAPI.enhance()`. */
export interface EnhanceOptions {
  /** AI model to apply. Defaults to `espcn` (v1's only supported model). */
  model?: EnhanceModel;
  /**
   * Fetch the source video from this `https` URL server-side instead of sending `video` in the
   * request body. When set, `video` is ignored. Loopback/private/link-local/`.local`/`.internal`
   * hosts are rejected by the server before any fetch.
   */
  sourceUrl?: string;
  /** Content-Type of the `video` body (e.g. `video/mp4`). Ignored when `sourceUrl` is set. */
  contentType?: string;
  /** Abort the request early. */
  signal?: AbortSignal;
}

/** Per-job receipt read off the response headers of a completed `POST /v1/enhance` call. */
export interface EnhanceReceipt {
  /** The model that ran, e.g. `espcn`. */
  model: EnhanceModel;
  /** Upscale factor actually applied. */
  scaleFactor: number;
  /** Input frame dimensions. */
  inputWidth: number;
  inputHeight: number;
  /** Output frame dimensions. */
  outputWidth: number;
  outputHeight: number;
  /** The meter this job billed against — `wave_enhance_minutes`. */
  meter: string;
  /** Output-duration minutes billed for this job (rounded up). */
  usageMinutes: number;
}

/** Result of `EnhanceAPI.enhance()` — the enhanced video plus its billing/receipt metadata. */
export interface EnhanceResult {
  /** The enhanced video body. */
  video: Blob;
  /** Content-Type the server returned for `video` (mirrors the source's content-type). */
  contentType: string;
  /** Per-job receipt read off the `x-enhance-*` / `x-wave-*` response headers. */
  receipt: EnhanceReceipt;
}
