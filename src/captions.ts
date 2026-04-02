/**
 * WAVE SDK - Captions API
 *
 * Generate, manage, and translate captions for video content.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from './client';
import type { CaptionStatus, CaptionFormat, CaptionTrack, CaptionCue, CaptionWord, CaptionStyle, GenerateCaptionsRequest, UploadCaptionsRequest, UpdateCaptionsRequest, TranslateCaptionsRequest, BurnInCaptionsRequest, BurnInJob, ListCaptionsParams } from './captions-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Caption status
 */

/**
 * Caption format
 */

/**
 * Caption track
 */

/**
 * Caption cue (single caption segment)
 */

/**
 * Word-level timing
 */

/**
 * Caption styling
 */

/**
 * Generate captions request
 */

/**
 * Upload captions request
 */

/**
 * Update captions request
 */

/**
 * Translate captions request
 */

/**
 * Burn-in captions request
 */

/**
 * Burn-in job
 */

/**
 * List captions params
 */

// ============================================================================
// Captions API
// ============================================================================

/**
 * Captions API client
 */
export class CaptionsAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/captions';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Caption Tracks
  // ==========================================================================

  /**
   * Generate captions using AI
   *
   * Requires: captions:generate permission
   */
  async generate(request: GenerateCaptionsRequest): Promise<CaptionTrack> {
    return this.client.post<CaptionTrack>(`${this.basePath}/generate`, request);
  }

  /**
   * Upload existing captions
   *
   * Requires: captions:create permission
   */
  async upload(request: UploadCaptionsRequest): Promise<CaptionTrack> {
    return this.client.post<CaptionTrack>(`${this.basePath}/upload`, request);
  }

  /**
   * Get a caption track by ID
   *
   * Requires: captions:read permission
   */
  async get(trackId: string): Promise<CaptionTrack> {
    return this.client.get<CaptionTrack>(`${this.basePath}/${trackId}`);
  }

  /**
   * Update a caption track
   *
   * Requires: captions:update permission
   */
  async update(trackId: string, request: UpdateCaptionsRequest): Promise<CaptionTrack> {
    return this.client.patch<CaptionTrack>(`${this.basePath}/${trackId}`, request);
  }

  /**
   * Remove a caption track
   *
   * Requires: captions:remove permission (server-side RBAC enforced)
   */
  async remove(trackId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${trackId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * List caption tracks
   *
   * Requires: captions:read permission
   */
  async list(params?: ListCaptionsParams): Promise<PaginatedResponse<CaptionTrack>> {
    return this.client.get<PaginatedResponse<CaptionTrack>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get caption tracks for a specific media
   *
   * Requires: captions:read permission
   */
  async getForMedia(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'stream'
  ): Promise<CaptionTrack[]> {
    const result = await this.list({ media_id: mediaId, media_type: mediaType });
    return result.data;
  }

  // ==========================================================================
  // Caption Cues
  // ==========================================================================

  /**
   * Get caption cues (segments)
   *
   * Requires: captions:read permission
   */
  async getCues(
    trackId: string,
    params?: PaginationParams & { start_time?: number; end_time?: number }
  ): Promise<PaginatedResponse<CaptionCue>> {
    return this.client.get<PaginatedResponse<CaptionCue>>(
      `${this.basePath}/${trackId}/cues`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Update a caption cue
   *
   * Requires: captions:update permission
   */
  async updateCue(
    trackId: string,
    cueId: string,
    updates: Partial<Pick<CaptionCue, 'text' | 'start_time' | 'end_time' | 'speaker' | 'style'>>
  ): Promise<CaptionCue> {
    return this.client.patch<CaptionCue>(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      updates
    );
  }

  /**
   * Add a new caption cue
   *
   * Requires: captions:update permission
   */
  async addCue(
    trackId: string,
    cue: Omit<CaptionCue, 'id' | 'confidence' | 'words'>
  ): Promise<CaptionCue> {
    return this.client.post<CaptionCue>(
      `${this.basePath}/${trackId}/cues`,
      cue
    );
  }

  /**
   * Remove a caption cue
   *
   * Requires: captions:update permission (server-side RBAC enforced)
   */
  async removeCue(trackId: string, cueId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Bulk update cues
   *
   * Requires: captions:update permission
   */
  async bulkUpdateCues(
    trackId: string,
    updates: Array<{ id: string; text?: string; start_time?: number; end_time?: number }>
  ): Promise<{ updated: number }> {
    return this.client.post(`${this.basePath}/${trackId}/cues/bulk`, { updates });
  }

  // ==========================================================================
  // Translation
  // ==========================================================================

  /**
   * Translate a caption track to another language
   *
   * Requires: captions:translate permission
   */
  async translate(
    trackId: string,
    request: TranslateCaptionsRequest
  ): Promise<CaptionTrack> {
    return this.client.post<CaptionTrack>(
      `${this.basePath}/${trackId}/translate`,
      request
    );
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Export captions in a specific format
   *
   * Requires: captions:read permission
   */
  async exportFormat(
    trackId: string,
    format: CaptionFormat
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.get(`${this.basePath}/${trackId}/export`, {
      params: { format } as unknown as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get captions as plain text
   *
   * Requires: captions:read permission
   */
  async getText(trackId: string): Promise<string> {
    const result = await this.client.get<{ text: string }>(
      `${this.basePath}/${trackId}/text`
    );
    return result.text;
  }

  // ==========================================================================
  // Burn-In
  // ==========================================================================

  /**
   * Burn captions into video
   *
   * Requires: captions:burnin permission
   */
  async burnIn(request: BurnInCaptionsRequest): Promise<BurnInJob> {
    return this.client.post<BurnInJob>(`${this.basePath}/burn-in`, request);
  }

  /**
   * Get burn-in job status
   *
   * Requires: captions:read permission
   */
  async getBurnInJob(jobId: string): Promise<BurnInJob> {
    return this.client.get<BurnInJob>(`${this.basePath}/burn-in/${jobId}`);
  }

  /**
   * Wait for burn-in to complete
   */
  async waitForBurnIn(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: BurnInJob) => void;
    }
  ): Promise<BurnInJob> {
    const pollInterval = options?.pollInterval || 3000;
    const timeout = options?.timeout || 1800000; // 30 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getBurnInJob(jobId);

      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'ready') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(`Burn-in failed: ${job.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Burn-in timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for caption generation to complete
   */
  async waitForReady(
    trackId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (track: CaptionTrack) => void;
    }
  ): Promise<CaptionTrack> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const track = await this.get(trackId);

      if (options?.onProgress) {
        options.onProgress(track);
      }

      if (track.status === 'ready') {
        return track;
      }

      if (track.status === 'failed') {
        throw new Error(`Caption generation failed: ${track.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Caption generation timed out after ${timeout}ms`);
  }

  /**
   * Get supported languages
   *
   * Requires: captions:read permission
   */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      native_name: string;
      supports_generation: boolean;
      supports_translation: boolean;
    }>
  > {
    return this.client.get(`${this.basePath}/languages`);
  }

  /**
   * Detect language from audio
   *
   * Requires: captions:generate permission
   */
  async detectLanguage(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'stream'
  ): Promise<{
    detected_language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
  }> {
    return this.client.post(`${this.basePath}/detect-language`, {
      media_id: mediaId,
      media_type: mediaType,
    });
  }
}

/**
 * Create a Captions API instance
 */
export function createCaptionsAPI(client: WaveClient): CaptionsAPI {
  return new CaptionsAPI(client);
}
