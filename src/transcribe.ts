/**
 * WAVE SDK - Transcribe API
 *
 * Transcribe recordings and media files, with optional speaker labels and word timing.
 *
 * The gateway forwards `/v1/transcribe` to the WAVE transcribe edge, which serves exactly these
 * routes:
 *
 *   POST   /v1/transcribe          create()   transcribe a recording or media URL
 *   GET    /v1/transcribe          list()
 *   GET    /v1/transcribe/{id}     get()
 *   DELETE /v1/transcribe/{id}     remove()
 *
 * Transcription runs synchronously: `create()` answers with a job that is already `completed`
 * (with `text`, and `segments` / `words` when asked for) or `failed`. The segment, speaker, export,
 * search and real-time methods of earlier releases have no backend; they now throw
 * RouteNotServedError before any network call, and are marked deprecated.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import { routeNotServed } from './errors';

export * from './transcribe-types';
import type {
  CreateTranscriptionRequest,
  ListTranscriptionsParams,
  Speaker,
  TranscriptExportFormat,
  Transcription,
  TranscriptionList,
  TranscriptionModel,
  TranscriptionSegment,
  UpdateTranscriptionRequest,
} from './transcribe-types';

/** How long `create()` waits: transcription runs inside the request, so it outlives the default. */
const CREATE_TIMEOUT_MS = 300_000;

/**
 * Transcribe API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave-av/sdk';
 * import { TranscribeAPI } from '@wave-av/sdk/transcribe';
 *
 * const transcribe = new TranscribeAPI(new WaveClient({ apiKey: 'your-api-key' }));
 *
 * const job = await transcribe.create({
 *   sourceId: 'https://example.com/talk.mp3',
 *   sourceType: 'audio',
 *   speakerLabels: true,
 * });
 * if (job.status === 'completed') console.log(job.text);
 * ```
 */
export class TranscribeAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/transcribe';

  constructor(client: WaveClient) {
    this.client = client;
  }

  private jobPath(transcriptionId: string): string {
    return `${this.basePath}/${encodeURIComponent(transcriptionId)}`;
  }

  // ==========================================================================
  // Transcriptions (served)
  // ==========================================================================

  /**
   * Transcribe a recording or media URL. `POST /v1/transcribe`, answered 201 with the finished job.
   *
   * Billed per transcribed minute, so it is sent once and never retried: a timeout after the edge
   * transcribed the media must not transcribe (and bill) it again. Media that could not be fetched
   * or transcribed comes back as a job with `status: 'failed'` and `errorMessage`, not as a throw.
   *
   * Requires: transcribe:write permission
   */
  async create(request: CreateTranscriptionRequest): Promise<Transcription> {
    return this.client.post<Transcription>(this.basePath, request, {
      timeout: CREATE_TIMEOUT_MS,
      noRetry: true,
    });
  }

  /**
   * Get a transcription by ID. `GET /v1/transcribe/{id}`.
   *
   * Requires: transcribe:read permission
   */
  async get(transcriptionId: string): Promise<Transcription> {
    return this.client.get<Transcription>(this.jobPath(transcriptionId));
  }

  /**
   * Delete a transcription. `DELETE /v1/transcribe/{id}`.
   *
   * Requires: transcribe:write permission
   */
  async remove(transcriptionId: string): Promise<void> {
    await this.client.delete(this.jobPath(transcriptionId));
  }

  /**
   * List transcriptions. `GET /v1/transcribe`.
   *
   * Requires: transcribe:read permission
   */
  async list(params?: ListTranscriptionsParams): Promise<TranscriptionList> {
    return this.client.get<TranscriptionList>(this.basePath, {
      params: { page: params?.page, perPage: params?.perPage, status: params?.status },
    });
  }

  /**
   * The transcript text of a completed job, read from `get()`. Throws when the job has no text
   * (it failed, or is not completed).
   *
   * Requires: transcribe:read permission
   */
  async getText(transcriptionId: string): Promise<string> {
    const t = await this.get(transcriptionId);
    if (typeof t.text !== 'string') {
      throw new Error(
        `Transcription ${transcriptionId} has no text (status ${t.status}${t.errorMessage ? `: ${t.errorMessage}` : ''})`
      );
    }
    return t.text;
  }

  /**
   * Poll a transcription until it is `completed`, or throw when it `failed` or was `cancelled`.
   *
   * The edge transcribes synchronously, so a job from `create()` is already final and this returns
   * (or throws) on the first poll. Kept for callers written against an asynchronous backend.
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

      if (transcription.status === 'completed') {
        return transcription;
      }

      if (transcription.status === 'failed' || transcription.status === 'cancelled') {
        throw new Error(
          `Transcription ${transcription.status}: ${transcription.errorMessage || 'no reason given'}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transcription timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Unserved (deprecated): each throws RouteNotServedError without a network call
  // ==========================================================================

  /** @deprecated Transcriptions cannot be edited after they run. */
  async update(_transcriptionId: string, _request: UpdateTranscriptionRequest): Promise<Transcription> {
    throw routeNotServed('transcribe.update', 'PATCH /v1/transcribe/{id}');
  }

  /** @deprecated Create with `speakerLabels: true`; the job's `segments` carry the timed text. */
  async getSegments(
    _transcriptionId: string,
    _params?: PaginationParams & { start_time?: number; end_time?: number; speaker_id?: number }
  ): Promise<PaginatedResponse<TranscriptionSegment>> {
    throw routeNotServed('transcribe.getSegments', 'GET /v1/transcribe/{id}/segments', 'transcribe.get(id) and its segments');
  }

  /** @deprecated No segment-editing route is served. */
  async updateSegment(
    _transcriptionId: string,
    _segmentId: string,
    _updates: { text?: string; speaker?: string; speaker_id?: number }
  ): Promise<TranscriptionSegment> {
    throw routeNotServed('transcribe.updateSegment', 'PATCH /v1/transcribe/{id}/segments/{segmentId}');
  }

  /** @deprecated No segment-editing route is served. */
  async mergeSegments(_transcriptionId: string, _segmentIds: string[]): Promise<TranscriptionSegment> {
    throw routeNotServed('transcribe.mergeSegments', 'POST /v1/transcribe/{id}/segments/merge');
  }

  /** @deprecated No segment-editing route is served. */
  async splitSegment(
    _transcriptionId: string,
    _segmentId: string,
    _splitTime: number
  ): Promise<{ first: TranscriptionSegment; second: TranscriptionSegment }> {
    throw routeNotServed('transcribe.splitSegment', 'POST /v1/transcribe/{id}/segments/{segmentId}/split');
  }

  /** @deprecated No speaker route is served; read `segments[].speaker` from `get()`. */
  async getSpeakers(_transcriptionId: string): Promise<Speaker[]> {
    throw routeNotServed('transcribe.getSpeakers', 'GET /v1/transcribe/{id}/speakers', 'transcribe.get(id) and segments[].speaker');
  }

  /** @deprecated No speaker route is served. */
  async updateSpeaker(_transcriptionId: string, _speakerId: number, _label: string): Promise<Speaker> {
    throw routeNotServed('transcribe.updateSpeaker', 'PATCH /v1/transcribe/{id}/speakers/{speakerId}');
  }

  /** @deprecated No speaker route is served. */
  async mergeSpeakers(_transcriptionId: string, _speakerIds: number[], _newLabel?: string): Promise<Speaker> {
    throw routeNotServed('transcribe.mergeSpeakers', 'POST /v1/transcribe/{id}/speakers/merge');
  }

  /** @deprecated No export route is served; for caption files use `wave.captions.download()`. */
  async exportTranscription(
    _transcriptionId: string,
    _format: TranscriptExportFormat,
    _options?: {
      include_timestamps?: boolean;
      include_speakers?: boolean;
      paragraph_breaks?: boolean;
    }
  ): Promise<{ url: string; expires_at: string }> {
    throw routeNotServed('transcribe.exportTranscription', 'POST /v1/transcribe/{id}/export', 'captions.download() for SRT/VTT');
  }

  /** @deprecated No search route is served. */
  async search(
    _transcriptionId: string,
    _query: string,
    _options?: { case_sensitive?: boolean; whole_word?: boolean }
  ): Promise<
    Array<{
      segment_id: string;
      text: string;
      start_time: number;
      end_time: number;
      highlight_ranges: Array<{ start: number; end: number }>;
    }>
  > {
    throw routeNotServed('transcribe.search', 'POST /v1/transcribe/{id}/search');
  }

  /** @deprecated No real-time transcription route is served under /v1/transcribe. */
  async startRealtime(
    _streamId: string,
    _options?: {
      language?: string;
      model?: TranscriptionModel;
      speaker_diarization?: boolean;
    }
  ): Promise<{
    session_id: string;
    websocket_url: string;
    expires_at: string;
  }> {
    throw routeNotServed('transcribe.startRealtime', 'POST /v1/transcribe/realtime/start');
  }

  /** @deprecated No real-time transcription route is served under /v1/transcribe. */
  async stopRealtime(_sessionId: string): Promise<Transcription> {
    throw routeNotServed('transcribe.stopRealtime', 'POST /v1/transcribe/realtime/{sessionId}/stop');
  }

  /** @deprecated No real-time transcription route is served under /v1/transcribe. */
  async getRealtimeStatus(_sessionId: string): Promise<{
    status: 'active' | 'paused' | 'stopped';
    duration: number;
    word_count: number;
    segments_count: number;
  }> {
    throw routeNotServed('transcribe.getRealtimeStatus', 'GET /v1/transcribe/realtime/{sessionId}');
  }

  /** @deprecated No language-detection route is served; omit `language` on `create()` to detect it. */
  async detectLanguage(_sourceUrl: string): Promise<{
    detected_language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
  }> {
    throw routeNotServed('transcribe.detectLanguage', 'POST /v1/transcribe/detect-language', 'transcribe.create() without language');
  }

  /** @deprecated No language-list route is served. */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      native_name: string;
      models: TranscriptionModel[];
    }>
  > {
    throw routeNotServed('transcribe.getSupportedLanguages', 'GET /v1/transcribe/languages');
  }

  /** @deprecated No estimate route is served; the gateway's x402 quote on `/v1/transcribe` prices a call. */
  async estimateCost(
    _durationSeconds: number,
    _model: TranscriptionModel = 'default',
    _options?: { speaker_diarization?: boolean }
  ): Promise<{
    estimated_cost: number;
    currency: string;
    breakdown: Record<string, number>;
  }> {
    throw routeNotServed('transcribe.estimateCost', 'POST /v1/transcribe/estimate');
  }
}

/**
 * Create a Transcribe API instance
 */
export function createTranscribeAPI(client: WaveClient): TranscribeAPI {
  return new TranscribeAPI(client);
}
