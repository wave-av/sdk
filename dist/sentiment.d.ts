/**
 * WAVE SDK - Sentiment API
 *
 * Analyze sentiment and emotions in audio, video, and text content.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Analysis status
 */
export type AnalysisStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Sentiment label
 */
export type SentimentLabel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
/**
 * Emotion type
 */
export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'contempt' | 'neutral';
/**
 * Analysis source type
 */
export type SourceType = 'video' | 'audio' | 'text' | 'chat' | 'transcript';
/**
 * Sentiment analysis job
 */
export interface SentimentAnalysis extends Timestamps {
    id: string;
    organization_id: string;
    source_type: SourceType;
    source_id?: string;
    source_url?: string;
    status: AnalysisStatus;
    overall_sentiment: SentimentLabel;
    sentiment_score: number;
    confidence: number;
    dominant_emotions: EmotionType[];
    duration?: number;
    segment_count?: number;
    error?: string;
    metadata?: Metadata;
}
/**
 * Sentiment segment
 */
export interface SentimentSegment {
    id: string;
    start_time: number;
    end_time: number;
    text?: string;
    sentiment: SentimentLabel;
    sentiment_score: number;
    confidence: number;
    emotions: EmotionScore[];
    speaker_id?: number;
}
/**
 * Emotion score
 */
export interface EmotionScore {
    emotion: EmotionType;
    score: number;
    confidence: number;
}
/**
 * Sentiment trend point
 */
export interface SentimentTrend {
    timestamp: number;
    sentiment_score: number;
    dominant_emotion: EmotionType;
    window_size: number;
}
/**
 * Sentiment summary
 */
export interface SentimentSummary {
    overall_sentiment: SentimentLabel;
    sentiment_score: number;
    sentiment_distribution: Record<SentimentLabel, number>;
    emotion_distribution: Record<EmotionType, number>;
    key_moments: KeyMoment[];
    topics_sentiment: TopicSentiment[];
}
/**
 * Key emotional moment
 */
export interface KeyMoment {
    timestamp: number;
    end_time?: number;
    type: 'peak_positive' | 'peak_negative' | 'sentiment_shift' | 'high_emotion';
    sentiment_score: number;
    emotion: EmotionType;
    description?: string;
    text?: string;
}
/**
 * Topic sentiment
 */
export interface TopicSentiment {
    topic: string;
    sentiment: SentimentLabel;
    sentiment_score: number;
    mention_count: number;
    examples: string[];
}
/**
 * Create analysis request
 */
export interface CreateAnalysisRequest {
    source_type: SourceType;
    source_id?: string;
    source_url?: string;
    text?: string;
    /** Analysis options */
    options?: {
        /** Enable emotion detection */
        emotions?: boolean;
        /** Enable topic extraction */
        topics?: boolean;
        /** Enable key moment detection */
        key_moments?: boolean;
        /** Segment granularity in seconds */
        segment_size?: number;
        /** Language (auto-detect if not specified) */
        language?: string;
        /** Enable speaker-level analysis */
        per_speaker?: boolean;
    };
    /** Webhook URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
/**
 * Batch analysis request
 */
export interface BatchAnalysisRequest {
    items: Array<{
        source_type: SourceType;
        source_id?: string;
        source_url?: string;
        text?: string;
    }>;
    options?: CreateAnalysisRequest['options'];
    webhook_url?: string;
}
/**
 * List analyses params
 */
export interface ListAnalysesParams extends PaginationParams {
    status?: AnalysisStatus;
    source_type?: SourceType;
    sentiment?: SentimentLabel;
    created_after?: string;
    created_before?: string;
}
/**
 * Sentiment API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { SentimentAPI } from '@wave/sdk/sentiment';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const sentiment = new SentimentAPI(client);
 *
 * // Analyze sentiment of a video
 * const analysis = await sentiment.analyze({
 *   source_type: 'video',
 *   source_id: 'video_123',
 *   options: {
 *     emotions: true,
 *     key_moments: true,
 *   },
 * });
 *
 * // Wait for results
 * const result = await sentiment.waitForReady(analysis.id);
 * console.log('Overall sentiment:', result.overall_sentiment);
 * ```
 */
export declare class SentimentAPI {
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
export declare function createSentimentAPI(client: WaveClient): SentimentAPI;
