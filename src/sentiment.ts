/**
 * WAVE SDK - Sentiment API
 *
 * Analyze sentiment and emotions in audio, video, and text content.
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
import type { AnalysisStatus, SentimentLabel, EmotionType, SourceType, SentimentAnalysis, SentimentSegment, EmotionScore, SentimentTrend, SentimentSummary, KeyMoment, TopicSentiment, CreateAnalysisRequest, BatchAnalysisRequest, ListAnalysesParams } from './sentiment-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Analysis status
 */

/**
 * Sentiment label
 */

/**
 * Emotion type
 */

/**
 * Analysis source type
 */

/**
 * Sentiment analysis job
 */

/**
 * Sentiment segment
 */

/**
 * Emotion score
 */

/**
 * Sentiment trend point
 */

/**
 * Sentiment summary
 */

/**
 * Key emotional moment
 */

/**
 * Topic sentiment
 */

/**
 * Create analysis request
 */

/**
 * Batch analysis request
 */

/**
 * List analyses params
 */

// ============================================================================
// Sentiment API
// ============================================================================

/**
 * Sentiment API client
 */
export class SentimentAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/sentiment';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Analysis Jobs
  // ==========================================================================

  /**
   * Create a sentiment analysis job
   *
   * Requires: sentiment:analyze permission
   */
  async analyze(request: CreateAnalysisRequest): Promise<SentimentAnalysis> {
    return this.client.post<SentimentAnalysis>(this.basePath, request);
  }

  /**
   * Analyze text directly (synchronous for short text)
   *
   * Requires: sentiment:analyze permission
   */
  async analyzeText(
    text: string,
    options?: { emotions?: boolean; language?: string }
  ): Promise<{
    sentiment: SentimentLabel;
    sentiment_score: number;
    confidence: number;
    emotions?: EmotionScore[];
  }> {
    return this.client.post(`${this.basePath}/text`, { text, ...options });
  }

  /**
   * Batch analyze multiple items
   *
   * Requires: sentiment:analyze permission
   */
  async batchAnalyze(
    request: BatchAnalysisRequest
  ): Promise<{ batch_id: string; jobs: SentimentAnalysis[] }> {
    return this.client.post(`${this.basePath}/batch`, request);
  }

  /**
   * Get an analysis by ID
   *
   * Requires: sentiment:read permission
   */
  async get(analysisId: string): Promise<SentimentAnalysis> {
    return this.client.get<SentimentAnalysis>(`${this.basePath}/${analysisId}`);
  }

  /**
   * Remove an analysis
   *
   * Requires: sentiment:remove permission (server-side RBAC enforced)
   */
  async remove(analysisId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${analysisId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * List analyses
   *
   * Requires: sentiment:read permission
   */
  async list(
    params?: ListAnalysesParams
  ): Promise<PaginatedResponse<SentimentAnalysis>> {
    return this.client.get<PaginatedResponse<SentimentAnalysis>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  // ==========================================================================
  // Analysis Results
  // ==========================================================================

  /**
   * Get sentiment segments
   *
   * Requires: sentiment:read permission
   */
  async getSegments(
    analysisId: string,
    params?: PaginationParams & {
      start_time?: number;
      end_time?: number;
      sentiment?: SentimentLabel;
      min_score?: number;
    }
  ): Promise<PaginatedResponse<SentimentSegment>> {
    return this.client.get<PaginatedResponse<SentimentSegment>>(
      `${this.basePath}/${analysisId}/segments`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get sentiment summary
   *
   * Requires: sentiment:read permission
   */
  async getSummary(analysisId: string): Promise<SentimentSummary> {
    return this.client.get<SentimentSummary>(
      `${this.basePath}/${analysisId}/summary`
    );
  }

  /**
   * Get sentiment trend over time
   *
   * Requires: sentiment:read permission
   */
  async getTrend(
    analysisId: string,
    options?: { window_size?: number; resolution?: number }
  ): Promise<SentimentTrend[]> {
    return this.client.get<SentimentTrend[]>(
      `${this.basePath}/${analysisId}/trend`,
      { params: options }
    );
  }

  /**
   * Get key emotional moments
   *
   * Requires: sentiment:read permission
   */
  async getKeyMoments(
    analysisId: string,
    options?: { type?: KeyMoment['type']; limit?: number }
  ): Promise<KeyMoment[]> {
    return this.client.get<KeyMoment[]>(
      `${this.basePath}/${analysisId}/key-moments`,
      { params: options }
    );
  }

  /**
   * Get topic sentiments
   *
   * Requires: sentiment:read permission
   */
  async getTopicSentiments(
    analysisId: string,
    options?: { min_mentions?: number }
  ): Promise<TopicSentiment[]> {
    return this.client.get<TopicSentiment[]>(
      `${this.basePath}/${analysisId}/topics`,
      { params: options }
    );
  }

  // ==========================================================================
  // Speaker Analysis
  // ==========================================================================

  /**
   * Get sentiment by speaker
   *
   * Requires: sentiment:read permission
   */
  async getSpeakerSentiment(
    analysisId: string
  ): Promise<
    Array<{
      speaker_id: number;
      speaker_label?: string;
      sentiment: SentimentLabel;
      sentiment_score: number;
      dominant_emotions: EmotionType[];
      segment_count: number;
      total_duration: number;
    }>
  > {
    return this.client.get(`${this.basePath}/${analysisId}/speakers`);
  }

  // ==========================================================================
  // Real-time Analysis
  // ==========================================================================

  /**
   * Start real-time sentiment analysis
   *
   * Requires: sentiment:realtime permission
   */
  async startRealtime(
    streamId: string,
    options?: {
      emotions?: boolean;
      segment_size?: number;
      language?: string;
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
   * Stop real-time analysis
   *
   * Requires: sentiment:realtime permission
   */
  async stopRealtime(sessionId: string): Promise<SentimentAnalysis> {
    return this.client.post<SentimentAnalysis>(
      `${this.basePath}/realtime/${sessionId}/stop`
    );
  }

  /**
   * Get real-time session status
   *
   * Requires: sentiment:read permission
   */
  async getRealtimeStatus(
    sessionId: string
  ): Promise<{
    status: 'active' | 'paused' | 'stopped';
    duration: number;
    current_sentiment: SentimentLabel;
    current_score: number;
    segments_processed: number;
  }> {
    return this.client.get(`${this.basePath}/realtime/${sessionId}`);
  }

  // ==========================================================================
  // Comparison
  // ==========================================================================

  /**
   * Compare sentiment between analyses
   *
   * Requires: sentiment:read permission
   */
  async compare(
    analysisIds: string[]
  ): Promise<{
    analyses: Array<{
      id: string;
      sentiment: SentimentLabel;
      sentiment_score: number;
      dominant_emotions: EmotionType[];
    }>;
    comparison: {
      most_positive: string;
      most_negative: string;
      score_range: number;
      common_emotions: EmotionType[];
    };
  }> {
    return this.client.post(`${this.basePath}/compare`, {
      analysis_ids: analysisIds,
    });
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Export analysis results
   *
   * Requires: sentiment:read permission
   */
  async exportAnalysis(
    analysisId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.post(`${this.basePath}/${analysisId}/export`, { format });
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for analysis to complete
   */
  async waitForReady(
    analysisId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (analysis: SentimentAnalysis) => void;
    }
  ): Promise<SentimentAnalysis> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const analysis = await this.get(analysisId);

      if (options?.onProgress) {
        options.onProgress(analysis);
      }

      if (analysis.status === 'ready') {
        return analysis;
      }

      if (analysis.status === 'failed') {
        throw new Error(
          `Sentiment analysis failed: ${analysis.error || 'Unknown error'}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Sentiment analysis timed out after ${timeout}ms`);
  }

  /**
   * Get supported languages
   *
   * Requires: sentiment:read permission
   */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      emotion_detection: boolean;
    }>
  > {
    return this.client.get(`${this.basePath}/languages`);
  }
}

/**
 * Create a Sentiment API instance
 */
export function createSentimentAPI(client: WaveClient): SentimentAPI {
  return new SentimentAPI(client);
}
