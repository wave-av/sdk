import { WaveClient } from './client.js';
import { CreateAnalysisRequest, SentimentAnalysis, SentimentLabel, EmotionScore, BatchAnalysisRequest, ListAnalysesParams, SentimentSegment, SentimentSummary, SentimentTrend, KeyMoment, TopicSentiment, EmotionType } from './sentiment-types.js';
export { AnalysisStatus, SourceType } from './sentiment-types.js';
import { PaginatedResponse, PaginationParams } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Sentiment API
 *
 * Analyze sentiment and emotions in audio, video, and text content.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

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
/**
 * Sentiment API client
 */
declare class SentimentAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a sentiment analysis job
     *
     * Requires: sentiment:analyze permission
     */
    analyze(request: CreateAnalysisRequest): Promise<SentimentAnalysis>;
    /**
     * Analyze text directly (synchronous for short text)
     *
     * Requires: sentiment:analyze permission
     */
    analyzeText(text: string, options?: {
        emotions?: boolean;
        language?: string;
    }): Promise<{
        sentiment: SentimentLabel;
        sentiment_score: number;
        confidence: number;
        emotions?: EmotionScore[];
    }>;
    /**
     * Batch analyze multiple items
     *
     * Requires: sentiment:analyze permission
     */
    batchAnalyze(request: BatchAnalysisRequest): Promise<{
        batch_id: string;
        jobs: SentimentAnalysis[];
    }>;
    /**
     * Get an analysis by ID
     *
     * Requires: sentiment:read permission
     */
    get(analysisId: string): Promise<SentimentAnalysis>;
    /**
     * Remove an analysis
     *
     * Requires: sentiment:remove permission (server-side RBAC enforced)
     */
    remove(analysisId: string): Promise<void>;
    /**
     * List analyses
     *
     * Requires: sentiment:read permission
     */
    list(params?: ListAnalysesParams): Promise<PaginatedResponse<SentimentAnalysis>>;
    /**
     * Get sentiment segments
     *
     * Requires: sentiment:read permission
     */
    getSegments(analysisId: string, params?: PaginationParams & {
        start_time?: number;
        end_time?: number;
        sentiment?: SentimentLabel;
        min_score?: number;
    }): Promise<PaginatedResponse<SentimentSegment>>;
    /**
     * Get sentiment summary
     *
     * Requires: sentiment:read permission
     */
    getSummary(analysisId: string): Promise<SentimentSummary>;
    /**
     * Get sentiment trend over time
     *
     * Requires: sentiment:read permission
     */
    getTrend(analysisId: string, options?: {
        window_size?: number;
        resolution?: number;
    }): Promise<SentimentTrend[]>;
    /**
     * Get key emotional moments
     *
     * Requires: sentiment:read permission
     */
    getKeyMoments(analysisId: string, options?: {
        type?: KeyMoment['type'];
        limit?: number;
    }): Promise<KeyMoment[]>;
    /**
     * Get topic sentiments
     *
     * Requires: sentiment:read permission
     */
    getTopicSentiments(analysisId: string, options?: {
        min_mentions?: number;
    }): Promise<TopicSentiment[]>;
    /**
     * Get sentiment by speaker
     *
     * Requires: sentiment:read permission
     */
    getSpeakerSentiment(analysisId: string): Promise<Array<{
        speaker_id: number;
        speaker_label?: string;
        sentiment: SentimentLabel;
        sentiment_score: number;
        dominant_emotions: EmotionType[];
        segment_count: number;
        total_duration: number;
    }>>;
    /**
     * Start real-time sentiment analysis
     *
     * Requires: sentiment:realtime permission
     */
    startRealtime(streamId: string, options?: {
        emotions?: boolean;
        segment_size?: number;
        language?: string;
    }): Promise<{
        session_id: string;
        websocket_url: string;
        expires_at: string;
    }>;
    /**
     * Stop real-time analysis
     *
     * Requires: sentiment:realtime permission
     */
    stopRealtime(sessionId: string): Promise<SentimentAnalysis>;
    /**
     * Get real-time session status
     *
     * Requires: sentiment:read permission
     */
    getRealtimeStatus(sessionId: string): Promise<{
        status: 'active' | 'paused' | 'stopped';
        duration: number;
        current_sentiment: SentimentLabel;
        current_score: number;
        segments_processed: number;
    }>;
    /**
     * Compare sentiment between analyses
     *
     * Requires: sentiment:read permission
     */
    compare(analysisIds: string[]): Promise<{
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
    }>;
    /**
     * Export analysis results
     *
     * Requires: sentiment:read permission
     */
    exportAnalysis(analysisId: string, format: 'json' | 'csv' | 'pdf'): Promise<{
        url: string;
        expires_at: string;
    }>;
    /**
     * Wait for analysis to complete
     */
    waitForReady(analysisId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (analysis: SentimentAnalysis) => void;
    }): Promise<SentimentAnalysis>;
    /**
     * Get supported languages
     *
     * Requires: sentiment:read permission
     */
    getSupportedLanguages(): Promise<Array<{
        code: string;
        name: string;
        emotion_detection: boolean;
    }>>;
}
/**
 * Create a Sentiment API instance
 */
declare function createSentimentAPI(client: WaveClient): SentimentAPI;

export { BatchAnalysisRequest, CreateAnalysisRequest, EmotionScore, EmotionType, KeyMoment, ListAnalysesParams, SentimentAPI, SentimentAnalysis, SentimentLabel, SentimentSegment, SentimentSummary, SentimentTrend, TopicSentiment, createSentimentAPI };
