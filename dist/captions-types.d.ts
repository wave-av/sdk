import { Timestamps, Metadata, PaginationParams } from './client-types.js';
import './telemetry.js';

type CaptionStatus = 'pending' | 'processing' | 'ready' | 'failed';
type CaptionFormat = 'srt' | 'vtt' | 'sbv' | 'ass' | 'ttml' | 'dfxp' | 'json';
interface CaptionTrack extends Timestamps {
    id: string;
    organization_id: string;
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    language: string;
    label: string;
    status: CaptionStatus;
    is_default: boolean;
    is_auto_generated: boolean;
    word_count?: number;
    duration?: number;
    accuracy_score?: number;
    url?: string;
    error?: string;
    metadata?: Metadata;
}
interface CaptionCue {
    id: string;
    start_time: number;
    end_time: number;
    text: string;
    speaker?: string;
    confidence?: number;
    words?: CaptionWord[];
    style?: CaptionStyle;
}
interface CaptionWord {
    word: string;
    start_time: number;
    end_time: number;
    confidence?: number;
}
interface CaptionStyle {
    align?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    line?: number;
    position?: number;
    size?: number;
    color?: string;
    background_color?: string;
    font_family?: string;
    font_weight?: 'normal' | 'bold';
    font_style?: 'normal' | 'italic';
}
interface GenerateCaptionsRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    language?: string;
    label?: string;
    /** Model to use for transcription */
    model?: 'standard' | 'enhanced' | 'whisper';
    /** Enable speaker diarization */
    speaker_diarization?: boolean;
    /** Number of expected speakers */
    speaker_count?: number;
    /** Filter profanity */
    profanity_filter?: boolean;
    /** Custom vocabulary */
    vocabulary?: string[];
    /** Enable word-level timing */
    word_timestamps?: boolean;
    /** Webhook URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
interface UploadCaptionsRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    language: string;
    label: string;
    format: CaptionFormat;
    /** Caption file content */
    content: string;
    is_default?: boolean;
    metadata?: Metadata;
}
interface UpdateCaptionsRequest {
    label?: string;
    is_default?: boolean;
    metadata?: Metadata;
}
interface TranslateCaptionsRequest {
    target_language: string;
    target_label?: string;
    /** Use professional translation */
    professional?: boolean;
    /** Preserve speaker labels */
    preserve_speakers?: boolean;
    webhook_url?: string;
}
interface BurnInCaptionsRequest {
    caption_track_id: string;
    style?: CaptionStyle;
    /** Output format */
    format?: 'mp4' | 'webm' | 'mov';
    /** Output quality */
    quality?: 'low' | 'medium' | 'high' | 'source';
    webhook_url?: string;
}
interface BurnInJob extends Timestamps {
    id: string;
    media_id: string;
    caption_track_id: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    progress: number;
    output_url?: string;
    error?: string;
}
interface ListCaptionsParams extends PaginationParams {
    media_id?: string;
    media_type?: 'video' | 'audio' | 'stream';
    language?: string;
    status?: CaptionStatus;
    is_auto_generated?: boolean;
}

export type { BurnInCaptionsRequest, BurnInJob, CaptionCue, CaptionFormat, CaptionStatus, CaptionStyle, CaptionTrack, CaptionWord, GenerateCaptionsRequest, ListCaptionsParams, TranslateCaptionsRequest, UpdateCaptionsRequest, UploadCaptionsRequest };
