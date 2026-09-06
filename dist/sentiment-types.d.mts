import { Metadata, PaginationParams, Timestamps } from './client-types.mjs';
import './telemetry.mjs';

type AnalysisStatus = 'pending' | 'processing' | 'ready' | 'failed';
type SentimentLabel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'contempt' | 'neutral';
type SourceType = 'video' | 'audio' | 'text' | 'chat' | 'transcript';
interface SentimentAnalysis extends Timestamps {
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
interface SentimentSegment {
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
interface EmotionScore {
    emotion: EmotionType;
    score: number;
    confidence: number;
}
interface SentimentTrend {
    timestamp: number;
    sentiment_score: number;
    dominant_emotion: EmotionType;
    window_size: number;
}
interface SentimentSummary {
    overall_sentiment: SentimentLabel;
    sentiment_score: number;
    sentiment_distribution: Record<SentimentLabel, number>;
    emotion_distribution: Record<EmotionType, number>;
    key_moments: KeyMoment[];
    topics_sentiment: TopicSentiment[];
}
interface KeyMoment {
    timestamp: number;
    end_time?: number;
    type: 'peak_positive' | 'peak_negative' | 'sentiment_shift' | 'high_emotion';
    sentiment_score: number;
    emotion: EmotionType;
    description?: string;
    text?: string;
}
interface TopicSentiment {
    topic: string;
    sentiment: SentimentLabel;
    sentiment_score: number;
    mention_count: number;
    examples: string[];
}
interface CreateAnalysisRequest {
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
interface BatchAnalysisRequest {
    items: Array<{
        source_type: SourceType;
        source_id?: string;
        source_url?: string;
        text?: string;
    }>;
    options?: CreateAnalysisRequest['options'];
    webhook_url?: string;
}
interface ListAnalysesParams extends PaginationParams {
    status?: AnalysisStatus;
    source_type?: SourceType;
    sentiment?: SentimentLabel;
    created_after?: string;
    created_before?: string;
}

export type { AnalysisStatus, BatchAnalysisRequest, CreateAnalysisRequest, EmotionScore, EmotionType, KeyMoment, ListAnalysesParams, SentimentAnalysis, SentimentLabel, SentimentSegment, SentimentSummary, SentimentTrend, SourceType, TopicSentiment };
