/**
 * WAVE SDK - Clips API
 *
 * Cut clips from recordings, and find the moments worth cutting.
 *
 * The gateway forwards `/v1/clips` to the WAVE clip engine, which serves exactly these routes:
 *
 *   POST   /v1/clips             create()   produce a clip, synchronously
 *   GET    /v1/clips             list()
 *   GET    /v1/clips/{clipId}    get()
 *   PATCH  /v1/clips/{clipId}    update()   title, description, category
 *   DELETE /v1/clips/{clipId}    remove()   the record and its produced files
 *   POST   /v1/clips/detect      detect()   candidate highlights from a recording's audio
 *
 * The export and highlight-to-clip methods of earlier releases have no backend. They now throw
 * RouteNotServedError before any network call, and are marked deprecated.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import { routeNotServed } from './errors';
import type {
  Clip,
  ClipCreateResult,
  ClipDetectionJob,
  ClipDetectRequest,
  ClipExport,
  ClipExportFormat,
  ClipList,
  ClipOutputFormat,
  ClipQuality,
  ClipQualityPreset,
  ClipStatus,
} from './clips-types';
export type * from './clips-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Create clip request (the clip engine's native shape).
 *
 * `source` is a recording id. `in` is the start offset as a time string (`"5s"`, `"2m"`, within
 * the first 10 minutes). Give the end as `out` or the length as `duration`; the clip must be
 * 1 to 60 seconds long.
 */
export interface CreateClipRequest {
  /** Recording id to clip from (e.g. `"rec_abc123"`). */
  source: string;
  /** Start offset as a time string, e.g. `"5s"` or `"2m"`. */
  in: string;
  /** End offset as a time string, e.g. `"10s"` or `"1m30s"`. Give this or `duration`. */
  out?: string;
  /** Clip length as a time string, e.g. `"30s"`. Give this or `out`. */
  duration?: string;
  title?: string;
  description?: string;
  category?: string;
  /** `public` is served openly; `private` (the default) only through signed URLs. */
  visibility?: 'public' | 'private';
  /** Default `720p`. */
  quality?: ClipQuality;
  /** Default `['mp4']`. */
  formats?: ClipOutputFormat[];
  /** Max output width, 10-2000. */
  width?: number;
  /** Max output height, 10-2000. */
  height?: number;
  fit?: 'contain' | 'cover' | 'scale-down';
  /** Frame count when `formats` includes `spritesheet`. Default 30. */
  spritesheetFrames?: number;
}

/** Update clip request. Only these fields change after a clip is produced. */
export interface UpdateClipRequest {
  title?: string;
  description?: string;
  category?: string;
}

/** List clips filters. */
export interface ListClipsParams {
  /** 1-based page. Default 1. */
  page?: number;
  /** Page size, 1-100. Default 20. */
  perPage?: number;
  /** Only clips cut from this recording. */
  videoId?: string;
  status?: ClipStatus;
  category?: string;
}

/**
 * @deprecated Request of the unserved `exportClip()` surface.
 */
export interface ExportClipRequest {
  format: ClipExportFormat;
  quality?: ClipQualityPreset;
  /** Custom resolution (e.g., "1920x1080") */
  resolution?: string;
  /** Custom bitrate in kbps */
  bitrate?: number;
  /** Include audio */
  include_audio?: boolean;
  /** Add watermark */
  watermark?: {
    image_url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    scale?: number;
  };
}

/**
 * @deprecated Result of the unserved `detectHighlights()`; `detect()` returns `ClipCandidate`s.
 */
export interface ClipHighlight {
  start_time: number;
  end_time: number;
  score: number;
  type: 'action' | 'speech' | 'emotion' | 'custom';
  label?: string;
}

// ============================================================================
// Clips API
// ============================================================================

/**
 * Clips API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave-av/sdk';
 * import { ClipsAPI } from '@wave-av/sdk/clips';
 *
 * const clips = new ClipsAPI(new WaveClient({ apiKey: 'your-api-key' }));
 *
 * // Produce a 30-second clip from a recording. It is ready when create() returns.
 * const { clipId, assets } = await clips.create({ source: 'rec_abc123', in: '2m', out: '2m30s' });
 * console.log(clipId, assets.map((a) => a.url));
 * ```
 */
export class ClipsAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/clips';

  constructor(client: WaveClient) {
    this.client = client;
  }

  private clipPath(clipId: string): string {
    return `${this.basePath}/${encodeURIComponent(clipId)}`;
  }

  /**
   * Produce a clip. `POST /v1/clips`, answered 201 once the clip exists.
   *
   * Billed per output minute, so it is sent once and never retried: a timeout after the engine
   * produced the clip must not produce (and bill) it again.
   *
   * Requires: clips:write permission
   */
  async create(request: CreateClipRequest): Promise<ClipCreateResult> {
    return this.client.post<ClipCreateResult>(this.basePath, request, { noRetry: true });
  }

  /**
   * Get a clip by ID. `GET /v1/clips/{clipId}`.
   *
   * Requires: clips:read permission
   */
  async get(clipId: string): Promise<Clip> {
    return this.client.get<Clip>(this.clipPath(clipId));
  }

  /**
   * Update a clip's title, description or category. `PATCH /v1/clips/{clipId}`.
   *
   * Requires: clips:write permission
   */
  async update(clipId: string, request: UpdateClipRequest): Promise<Clip> {
    return this.client.patch<Clip>(this.clipPath(clipId), request);
  }

  /**
   * Remove a clip and its produced files. `DELETE /v1/clips/{clipId}`.
   *
   * Requires: clips:write permission
   */
  async remove(clipId: string): Promise<void> {
    await this.client.delete(this.clipPath(clipId));
  }

  /**
   * List clips, newest first. `GET /v1/clips`.
   *
   * Requires: clips:read permission
   */
  async list(params?: ListClipsParams): Promise<ClipList> {
    return this.client.get<ClipList>(this.basePath, {
      params: {
        page: params?.page,
        perPage: params?.perPage,
        videoId: params?.videoId,
        status: params?.status,
        category: params?.category,
      },
    });
  }

  /**
   * Find candidate highlights in a recording. `POST /v1/clips/detect`.
   *
   * Runs synchronously over the start of the recording's audio (transcript plus sentiment
   * scoring), so the answer already carries `results`. Not retried, because each call runs (and
   * bills) the analysis again.
   *
   * Requires: clips:write permission
   */
  async detect(request: ClipDetectRequest): Promise<ClipDetectionJob> {
    return this.client.post<ClipDetectionJob>(`${this.basePath}/detect`, request, {
      timeout: 120_000,
      noRetry: true,
    });
  }

  /**
   * @deprecated No WAVE backend serves clip exports; `create()` already returns the produced files
   * in `assets`. Throws RouteNotServedError without a network call.
   */
  async exportClip(_clipId: string, _request: ExportClipRequest): Promise<ClipExport> {
    throw routeNotServed('clips.exportClip', 'POST /v1/clips/{clipId}/export', 'create({ formats }) and its assets');
  }

  /** @deprecated No WAVE backend serves clip exports. Throws RouteNotServedError without a network call. */
  async getExport(_clipId: string, _exportId: string): Promise<ClipExport> {
    throw routeNotServed('clips.getExport', 'GET /v1/clips/{clipId}/exports/{exportId}');
  }

  /** @deprecated No WAVE backend serves clip exports. Throws RouteNotServedError without a network call. */
  async listExports(_clipId: string, _params?: PaginationParams): Promise<PaginatedResponse<ClipExport>> {
    throw routeNotServed('clips.listExports', 'GET /v1/clips/{clipId}/exports');
  }

  /**
   * @deprecated Served as `detect({ videoId, ... })` at `POST /v1/clips/detect`. Throws
   * RouteNotServedError without a network call.
   */
  async detectHighlights(
    _sourceType: 'stream' | 'recording',
    _sourceId: string,
    _options?: {
      types?: ('action' | 'speech' | 'emotion')[];
      min_score?: number;
      max_results?: number;
    }
  ): Promise<ClipHighlight[]> {
    throw routeNotServed('clips.detectHighlights', 'POST /v1/clips/highlights/detect', 'clips.detect({ videoId })');
  }

  /**
   * @deprecated No WAVE backend serves this. Call `detect()`, then `create()` for each candidate
   * you want (`{ source, in: c.in, duration: c.duration }`). Throws RouteNotServedError without a
   * network call.
   */
  async createFromHighlights(
    _sourceType: 'stream' | 'recording',
    _sourceId: string,
    _options?: {
      min_score?: number;
      max_clips?: number;
      title_prefix?: string;
      tags?: string[];
    }
  ): Promise<Clip[]> {
    throw routeNotServed(
      'clips.createFromHighlights',
      'POST /v1/clips/highlights/create',
      'clips.detect() and then clips.create() per candidate',
    );
  }

  /**
   * Poll a clip until it is `completed`, or throw when it `failed`.
   *
   * The clip engine produces synchronously, so a clip from `create()` is already `completed` and
   * this returns on the first poll. Kept for callers written against an asynchronous backend.
   */
  async waitForReady(
    clipId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (clip: Clip) => void;
    }
  ): Promise<Clip> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000; // 5 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const clip = await this.get(clipId);

      if (options?.onProgress) {
        options.onProgress(clip);
      }

      if (clip.status === 'completed') {
        return clip;
      }

      if (clip.status === 'failed') {
        throw new Error(`Clip processing failed: ${clipId}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Clip processing timed out after ${timeout}ms`);
  }

  /** @deprecated No WAVE backend serves clip exports. Throws RouteNotServedError without a network call. */
  async waitForExport(
    _clipId: string,
    _exportId: string,
    _options?: {
      pollInterval?: number;
      timeout?: number;
    }
  ): Promise<ClipExport> {
    throw routeNotServed('clips.waitForExport', 'GET /v1/clips/{clipId}/exports/{exportId}');
  }
}

/**
 * Create a Clips API instance
 */
export function createClipsAPI(client: WaveClient): ClipsAPI {
  return new ClipsAPI(client);
}
