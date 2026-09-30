/**
 * WAVE SDK - Captions API
 *
 * Caption recordings and media files, and download the result as SRT, VTT, text or JSON cues.
 *
 * The gateway forwards `/v1/captions` to the WAVE captions edge, which serves exactly these routes:
 *
 *   POST   /v1/captions                     create()    caption a recording or media URL
 *   GET    /v1/captions                     list()
 *   GET    /v1/captions/{jobId}             get()
 *   DELETE /v1/captions/{jobId}             remove()
 *   GET    /v1/captions/{jobId}/download    download()  ?language&format=srt|vtt|txt|json
 *
 * Captioning runs synchronously: `create()` answers with a job that is already `completed` or
 * `failed`. The track, cue, translation and burn-in methods of earlier releases have no backend;
 * they now throw RouteNotServedError before any network call, and are marked deprecated.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import { routeNotServed } from './errors';
import type {
  BurnInCaptionsRequest,
  BurnInJob,
  CaptionCue,
  CaptionDownloadFormat,
  CaptionFormat,
  CaptionJob,
  CaptionJobList,
  CaptionTrack,
  CreateCaptionJobRequest,
  GenerateCaptionsRequest,
  ListCaptionJobsParams,
  TranslateCaptionsRequest,
  UpdateCaptionsRequest,
  UploadCaptionsRequest,
} from './captions-types';
export type * from './captions-types';

/** How long `create()` waits: captioning runs inside the request, so it outlives the default. */
const CREATE_TIMEOUT_MS = 300_000;

// ============================================================================
// Captions API
// ============================================================================

/**
 * Captions API client
 *
 * @example
 * ```typescript
 * const job = await wave.captions.create({ videoId: 'rec_123', sourceLanguage: 'en' });
 * if (job.status === 'completed') {
 *   const srt = await wave.captions.download(job.id, { language: job.sourceLanguage, format: 'srt' });
 * }
 * ```
 */
export class CaptionsAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/captions';

  constructor(client: WaveClient) {
    this.client = client;
  }

  private jobPath(jobId: string): string {
    return `${this.basePath}/${encodeURIComponent(jobId)}`;
  }

  // ==========================================================================
  // Caption jobs (served)
  // ==========================================================================

  /**
   * Caption a recording or media URL. `POST /v1/captions`, answered 201 with the finished job.
   *
   * Billed per caption minute, so it is sent once and never retried: a timeout after the edge
   * captioned the media must not caption (and bill) it again. A job whose media could not be
   * fetched or transcribed comes back with `status: 'failed'` and `errorMessage`, not as a throw.
   *
   * Requires: captions:write permission
   */
  async create(request: CreateCaptionJobRequest): Promise<CaptionJob> {
    return this.client.post<CaptionJob>(this.basePath, request, {
      timeout: CREATE_TIMEOUT_MS,
      noRetry: true,
    });
  }

  /**
   * Get a caption job. `GET /v1/captions/{jobId}`.
   *
   * Requires: captions:read permission
   */
  async get(jobId: string): Promise<CaptionJob> {
    return this.client.get<CaptionJob>(this.jobPath(jobId));
  }

  /**
   * Delete a caption job. `DELETE /v1/captions/{jobId}`.
   *
   * Requires: captions:write permission
   */
  async remove(jobId: string): Promise<void> {
    await this.client.delete(this.jobPath(jobId));
  }

  /**
   * List caption jobs. `GET /v1/captions`.
   *
   * Requires: captions:read permission
   */
  async list(params?: ListCaptionJobsParams): Promise<CaptionJobList> {
    return this.client.get<CaptionJobList>(this.basePath, {
      params: {
        page: params?.page,
        perPage: params?.perPage,
        videoId: params?.videoId,
        status: params?.status,
      },
    });
  }

  /**
   * Caption jobs for one recording or media URL: `list({ videoId })`, first page. The second
   * parameter of earlier releases is accepted and unused: the id alone names the media.
   *
   * Requires: captions:read permission
   */
  async getForMedia(videoId: string, _mediaType?: 'video' | 'audio' | 'stream'): Promise<CaptionJob[]> {
    const result = await this.list({ videoId });
    return result.data;
  }

  /**
   * Download a completed job's captions. `GET /v1/captions/{jobId}/download`.
   *
   * `language` must be a language the job produced (see `job.outputs`; today that is
   * `job.sourceLanguage`). The edge answers 404 when the job is not completed or has no output in
   * that language. Returns the rendered file content.
   *
   * Requires: captions:read permission
   */
  async download(
    jobId: string,
    options: { language: string; format?: CaptionDownloadFormat }
  ): Promise<string> {
    const result = await this.client.get<{ content: string }>(`${this.jobPath(jobId)}/download`, {
      params: { language: options.language, format: options.format ?? 'srt' },
    });
    return result.content;
  }

  /**
   * A completed job's captions as plain text: `download(jobId, { format: 'txt' })` in `language`,
   * or in the job's source language when `language` is omitted (one extra `get()` to read it).
   *
   * Requires: captions:read permission
   */
  async getText(jobId: string, language?: string): Promise<string> {
    const lang = language ?? (await this.get(jobId)).sourceLanguage;
    return this.download(jobId, { language: lang, format: 'txt' });
  }

  /**
   * Poll a caption job until it is `completed`, or throw when it `failed` or was `cancelled`.
   *
   * The edge captions synchronously, so a job from `create()` is already final and this returns
   * (or throws) on the first poll. Kept for callers written against an asynchronous backend.
   */
  async waitForReady(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: CaptionJob) => void;
    }
  ): Promise<CaptionJob> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.get(jobId);

      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'completed') {
        return job;
      }

      if (job.status === 'failed' || job.status === 'cancelled') {
        throw new Error(`Caption job ${job.status}: ${job.errorMessage || 'no reason given'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Caption generation timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Unserved (deprecated): each throws RouteNotServedError without a network call
  // ==========================================================================

  /** @deprecated Served as `create({ videoId, sourceLanguage, speakerLabels })`. */
  async generate(_request: GenerateCaptionsRequest): Promise<CaptionTrack> {
    throw routeNotServed('captions.generate', 'POST /v1/captions/generate', 'captions.create({ videoId })');
  }

  /** @deprecated No WAVE backend accepts uploaded caption files. */
  async upload(_request: UploadCaptionsRequest): Promise<CaptionTrack> {
    throw routeNotServed('captions.upload', 'POST /v1/captions/upload');
  }

  /** @deprecated Caption jobs cannot be edited after they run. */
  async update(_trackId: string, _request: UpdateCaptionsRequest): Promise<CaptionTrack> {
    throw routeNotServed('captions.update', 'PATCH /v1/captions/{trackId}');
  }

  /** @deprecated No cue-level route is served; `download(jobId, { format: 'json' })` returns the cues. */
  async getCues(
    _trackId: string,
    _params?: PaginationParams & { start_time?: number; end_time?: number }
  ): Promise<PaginatedResponse<CaptionCue>> {
    throw routeNotServed('captions.getCues', 'GET /v1/captions/{trackId}/cues', "captions.download(jobId, { language, format: 'json' })");
  }

  /** @deprecated No cue-level route is served. */
  async updateCue(
    _trackId: string,
    _cueId: string,
    _updates: Partial<Pick<CaptionCue, 'text' | 'start_time' | 'end_time' | 'speaker' | 'style'>>
  ): Promise<CaptionCue> {
    throw routeNotServed('captions.updateCue', 'PATCH /v1/captions/{trackId}/cues/{cueId}');
  }

  /** @deprecated No cue-level route is served. */
  async addCue(_trackId: string, _cue: Omit<CaptionCue, 'id' | 'confidence' | 'words'>): Promise<CaptionCue> {
    throw routeNotServed('captions.addCue', 'POST /v1/captions/{trackId}/cues');
  }

  /** @deprecated No cue-level route is served. */
  async removeCue(_trackId: string, _cueId: string): Promise<void> {
    throw routeNotServed('captions.removeCue', 'DELETE /v1/captions/{trackId}/cues/{cueId}');
  }

  /** @deprecated No cue-level route is served. */
  async bulkUpdateCues(
    _trackId: string,
    _updates: Array<{ id: string; text?: string; start_time?: number; end_time?: number }>
  ): Promise<{ updated: number }> {
    throw routeNotServed('captions.bulkUpdateCues', 'POST /v1/captions/{trackId}/cues/bulk');
  }

  /** @deprecated No WAVE backend translates captions yet. */
  async translate(_trackId: string, _request: TranslateCaptionsRequest): Promise<CaptionTrack> {
    throw routeNotServed('captions.translate', 'POST /v1/captions/{trackId}/translate');
  }

  /** @deprecated Served as `download(jobId, { language, format })`, which returns the file content. */
  async exportFormat(_trackId: string, _format: CaptionFormat): Promise<{ url: string; expires_at: string }> {
    throw routeNotServed('captions.exportFormat', 'GET /v1/captions/{trackId}/export', 'captions.download(jobId, { language, format })');
  }

  /** @deprecated No WAVE backend burns captions into video yet. */
  async burnIn(_request: BurnInCaptionsRequest): Promise<BurnInJob> {
    throw routeNotServed('captions.burnIn', 'POST /v1/captions/burn-in');
  }

  /** @deprecated No WAVE backend burns captions into video yet. */
  async getBurnInJob(_jobId: string): Promise<BurnInJob> {
    throw routeNotServed('captions.getBurnInJob', 'GET /v1/captions/burn-in/{jobId}');
  }

  /** @deprecated No WAVE backend burns captions into video yet. */
  async waitForBurnIn(
    _jobId: string,
    _options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: BurnInJob) => void;
    }
  ): Promise<BurnInJob> {
    throw routeNotServed('captions.waitForBurnIn', 'GET /v1/captions/burn-in/{jobId}');
  }

  /** @deprecated No language-list route is served; `create()` answers 400 for an unknown locale. */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      native_name: string;
      supports_generation: boolean;
      supports_translation: boolean;
    }>
  > {
    throw routeNotServed('captions.getSupportedLanguages', 'GET /v1/captions/languages');
  }

  /** @deprecated No language-detection route is served. */
  async detectLanguage(
    _mediaId: string,
    _mediaType: 'video' | 'audio' | 'stream'
  ): Promise<{
    detected_language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
  }> {
    throw routeNotServed('captions.detectLanguage', 'POST /v1/captions/detect-language');
  }
}

/**
 * Create a Captions API instance
 */
export function createCaptionsAPI(client: WaveClient): CaptionsAPI {
  return new CaptionsAPI(client);
}
