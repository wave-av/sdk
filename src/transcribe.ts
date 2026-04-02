/**
 * WAVE SDK - Transcribe API
 *
 * Audio and video transcription with speaker diarization.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
} from './client';

export * from './transcribe-types';
import type {
  CreateTranscriptionRequest,
  ListTranscriptionsParams,
  Speaker,
  TranscriptExportFormat,
  Transcription,
  TranscriptionModel,
  TranscriptionSegment,
  UpdateTranscriptionRequest,
} from './transcribe-types';

export class TranscribeAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/transcribe';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Transcriptions
  // ==========================================================================

  /**
   * Create a transcription job
   *
   * Requires: transcribe:create permission
   */
  async create(request: CreateTranscriptionRequest): Promise<Transcription> {
    return this.client.post<Transcription>(this.basePath, request);
  }

  /**
   * Get a transcription by ID
   *
   * Requires: transcribe:read permission
   */
  async get(transcriptionId: string): Promise<Transcription> {
    return this.client.get<Transcription>(`${this.basePath}/${transcriptionId}`);
  }

  /**
   * Update a transcription
   *
   * Requires: transcribe:update permission
   */
  async update(
    transcriptionId: string,
    request: UpdateTranscriptionRequest
  ): Promise<Transcription> {
    return this.client.patch<Transcription>(
      `${this.basePath}/${transcriptionId}`,
      request
    );
  }

  /**
   * Remove a transcription
   *
   * Requires: transcribe:remove permission (server-side RBAC enforced)
   */
  async remove(transcriptionId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${transcriptionId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * List transcriptions
   *
   * Requires: transcribe:read permission
   */
  async list(
    params?: ListTranscriptionsParams
  ): Promise<PaginatedResponse<Transcription>> {
    return this.client.get<PaginatedResponse<Transcription>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  // ==========================================================================
  // Segments
  // ==========================================================================

  /**
   * Get transcription segments
   *
   * Requires: transcribe:read permission
   */
  async getSegments(
    transcriptionId: string,
    params?: PaginationParams & {
      start_time?: number;
      end_time?: number;
      speaker_id?: number;
    }
  ): Promise<PaginatedResponse<TranscriptionSegment>> {
    return this.client.get<PaginatedResponse<TranscriptionSegment>>(
      `${this.basePath}/${transcriptionId}/segments`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Update a segment
   *
   * Requires: transcribe:update permission
   */
  async updateSegment(
    transcriptionId: string,
    segmentId: string,
    updates: { text?: string; speaker?: string; speaker_id?: number }
  ): Promise<TranscriptionSegment> {
    return this.client.patch<TranscriptionSegment>(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}`,
      updates
    );
  }

  /**
   * Merge segments
   *
   * Requires: transcribe:update permission
   */
  async mergeSegments(
    transcriptionId: string,
    segmentIds: string[]
  ): Promise<TranscriptionSegment> {
    return this.client.post<TranscriptionSegment>(
      `${this.basePath}/${transcriptionId}/segments/merge`,
      { segment_ids: segmentIds }
    );
  }

  /**
   * Split a segment
   *
   * Requires: transcribe:update permission
   */
  async splitSegment(
    transcriptionId: string,
    segmentId: string,
    splitTime: number
  ): Promise<{ first: TranscriptionSegment; second: TranscriptionSegment }> {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}/split`,
      { split_time: splitTime }
    );
  }

  // ==========================================================================
  // Speakers
  // ==========================================================================

  /**
   * Get speakers
   *
   * Requires: transcribe:read permission
   */
  async getSpeakers(transcriptionId: string): Promise<Speaker[]> {
    return this.client.get<Speaker[]>(
      `${this.basePath}/${transcriptionId}/speakers`
    );
  }

  /**
   * Update speaker label
   *
   * Requires: transcribe:update permission
   */
  async updateSpeaker(
    transcriptionId: string,
    speakerId: number,
    label: string
  ): Promise<Speaker> {
    return this.client.patch<Speaker>(
      `${this.basePath}/${transcriptionId}/speakers/${speakerId}`,
      { label }
    );
  }

  /**
   * Merge speakers
   *
   * Requires: transcribe:update permission
   */
  async mergeSpeakers(
    transcriptionId: string,
    speakerIds: number[],
    newLabel?: string
  ): Promise<Speaker> {
    return this.client.post<Speaker>(
      `${this.basePath}/${transcriptionId}/speakers/merge`,
      { speaker_ids: speakerIds, label: newLabel }
    );
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Export transcription
   *
   * Requires: transcribe:read permission
   */
  async exportTranscription(
    transcriptionId: string,
    format: TranscriptExportFormat,
    options?: {
      include_timestamps?: boolean;
      include_speakers?: boolean;
      paragraph_breaks?: boolean;
    }
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.post(`${this.basePath}/${transcriptionId}/export`, {
      format,
      ...options,
    });
  }

  /**
   * Get plain text transcript
   *
   * Requires: transcribe:read permission
   */
  async getText(
    transcriptionId: string,
    options?: { include_speakers?: boolean; paragraph_breaks?: boolean }
  ): Promise<string> {
    const result = await this.client.get<{ text: string }>(
      `${this.basePath}/${transcriptionId}/text`,
      { params: options }
    );
    return result.text;
  }

  // ==========================================================================
  // Search
  // ==========================================================================

  /**
   * Search within a transcription
   *
   * Requires: transcribe:read permission
   */
  async search(
    transcriptionId: string,
    query: string,
    options?: { case_sensitive?: boolean; whole_word?: boolean }
  ): Promise<
    Array<{
      segment_id: string;
      text: string;
      start_time: number;
      end_time: number;
      highlight_ranges: Array<{ start: number; end: number }>;
    }>
  > {
    return this.client.post(`${this.basePath}/${transcriptionId}/search`, {
      query,
      ...options,
    });
  }

  // ==========================================================================
  // Real-time
  // ==========================================================================

  /**
   * Start real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async startRealtime(
    streamId: string,
    options?: {
      language?: string;
      model?: TranscriptionModel;
      speaker_diarization?: boolean;
    }
  ): Promise<{
    session_id: string;
    websocket_url: string;
    expires_at: string;
  }> {
    return this.client.post(`${this.basePath}/realtime/start`, {
      stream_id: streamId,
      ...options,
    });
  }

  /**
   * Stop real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async stopRealtime(sessionId: string): Promise<Transcription> {
    return this.client.post<Transcription>(
      `${this.basePath}/realtime/${sessionId}/stop`
    );
  }

  /**
   * Get real-time session status
   *
   * Requires: transcribe:read permission
   */
  async getRealtimeStatus(
    sessionId: string
  ): Promise<{
    status: 'active' | 'paused' | 'stopped';
    duration: number;
    word_count: number;
    segments_count: number;
  }> {
    return this.client.get(`${this.basePath}/realtime/${sessionId}`);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for transcription to complete
   */
  async waitForReady(
    transcriptionId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (transcription: Transcription) => void;
    }
  ): Promise<Transcription> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 1800000; // 30 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const transcription = await this.get(transcriptionId);

      if (options?.onProgress) {
        options.onProgress(transcription);
      }

      if (transcription.status === 'ready') {
        return transcription;
      }

      if (transcription.status === 'failed') {
        throw new Error(
          `Transcription failed: ${transcription.error || 'Unknown error'}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transcription timed out after ${timeout}ms`);
  }

  /**
   * Detect language from audio
   *
   * Requires: transcribe:read permission
   */
  async detectLanguage(
    sourceUrl: string
  ): Promise<{
    detected_language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
  }> {
    return this.client.post(`${this.basePath}/detect-language`, {
      source_url: sourceUrl,
    });
  }

  /**
   * Get supported languages
   *
   * Requires: transcribe:read permission
   */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      native_name: string;
      models: TranscriptionModel[];
    }>
  > {
    return this.client.get(`${this.basePath}/languages`);
  }

  /**
   * Estimate transcription cost
   *
   * Requires: transcribe:read permission
   */
  async estimateCost(
    durationSeconds: number,
    model: TranscriptionModel = 'standard',
    options?: { speaker_diarization?: boolean }
  ): Promise<{
    estimated_cost: number;
    currency: string;
    breakdown: Record<string, number>;
  }> {
    return this.client.post(`${this.basePath}/estimate`, {
      duration_seconds: durationSeconds,
      model,
      ...options,
    });
  }
}

/**
 * Create a Transcribe API instance
 */
export function createTranscribeAPI(client: WaveClient): TranscribeAPI {
  return new TranscribeAPI(client);
}
