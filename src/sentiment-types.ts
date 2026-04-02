export type AnalysisStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type SentimentLabel =
  | 'very_negative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'very_positive';
export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'contempt'
  | 'neutral';
export type SourceType = 'video' | 'audio' | 'text' | 'chat' | 'transcript';
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
export interface EmotionScore {
  emotion: EmotionType;
  score: number;
  confidence: number;
}
export interface SentimentTrend {
  timestamp: number;
  sentiment_score: number;
  dominant_emotion: EmotionType;
  window_size: number;
}
export interface SentimentSummary {
  overall_sentiment: SentimentLabel;
  sentiment_score: number;
  sentiment_distribution: Record<SentimentLabel, number>;
  emotion_distribution: Record<EmotionType, number>;
  key_moments: KeyMoment[];
  topics_sentiment: TopicSentiment[];
}
export interface KeyMoment {
  timestamp: number;
  end_time?: number;
  type: 'peak_positive' | 'peak_negative' | 'sentiment_shift' | 'high_emotion';
  sentiment_score: number;
  emotion: EmotionType;
  description?: string;
  text?: string;
}
export interface TopicSentiment {
  topic: string;
  sentiment: SentimentLabel;
  sentiment_score: number;
  mention_count: number;
  examples: string[];
}
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
export interface ListAnalysesParams extends PaginationParams {
  status?: AnalysisStatus;
  source_type?: SourceType;
  sentiment?: SentimentLabel;
  created_after?: string;
  created_before?: string;
}
