import { Metadata, PaginationParams, Timestamps } from './client-types.mjs';
import './telemetry.mjs';

/**
 * WAVE SDK - Transcribe API
 *
 * Audio and video transcription with speaker diarization.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Transcription status
 */
type TranscriptionStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Transcription model
 */
type TranscriptionModel = 'standard' | 'enhanced' | 'whisper-large' | 'whisper-medium' | 'medical' | 'legal';
/**
 * Transcription job
 */
interface Transcription extends Timestamps {
    id: string;
    organization_id: string;
    source_url?: string;
    source_type: 'upload' | 'url' | 'stream' | 'recording';
    source_id?: string;
    status: TranscriptionStatus;
    language: string;
    detected_language?: string;
    model: TranscriptionModel;
    duration?: number;
    word_count?: number;
    confidence?: number;
    speaker_count?: number;
    cost?: number;
    error?: string;
    metadata?: Metadata;
}
/**
 * Transcription segment
 */
interface TranscriptionSegment {
    id: string;
    start_time: number;
    end_time: number;
    text: string;
    speaker?: string;
    speaker_id?: number;
    confidence: number;
    words?: TranscriptionWord[];
}
/**
 * Word-level transcription
 */
interface TranscriptionWord {
    word: string;
    start_time: number;
    end_time: number;
    confidence: number;
    speaker_id?: number;
}
/**
 * Speaker info
 */
interface Speaker {
    id: number;
    label: string;
    segments_count: number;
    total_duration: number;
    confidence?: number;
}
/**
 * Create transcription request
 */
interface CreateTranscriptionRequest {
    /** Source URL to transcribe */
    source_url?: string;
    /** Source type */
    source_type: 'upload' | 'url' | 'stream' | 'recording';
    /** Source ID for streams/recordings */
    source_id?: string;
    /** Language code (auto-detect if not specified) */
    language?: string;
    /** Transcription model */
    model?: TranscriptionModel;
    /** Enable speaker diarization */
    speaker_diarization?: boolean;
    /** Expected number of speakers */
    speaker_count?: number;
    /** Enable punctuation */
    punctuation?: boolean;
    /** Filter profanity */
    profanity_filter?: boolean;
    /** Custom vocabulary/terms */
    vocabulary?: string[];
    /** Boost specific words */
    vocabulary_boost?: number;
    /** Enable word timestamps */
    word_timestamps?: boolean;
    /** Callback URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
/**
 * Update transcription request
 */
interface UpdateTranscriptionRequest {
    metadata?: Metadata;
}
/**
 * List transcriptions params
 */
interface ListTranscriptionsParams extends PaginationParams {
    status?: TranscriptionStatus;
    source_type?: 'upload' | 'url' | 'stream' | 'recording';
    language?: string;
    model?: TranscriptionModel;
    created_after?: string;
    created_before?: string;
}
/**
 * Export format
 */
type TranscriptExportFormat = 'txt' | 'json' | 'srt' | 'vtt' | 'docx' | 'pdf';

export type { CreateTranscriptionRequest, ListTranscriptionsParams, Speaker, TranscriptExportFormat, Transcription, TranscriptionModel, TranscriptionSegment, TranscriptionStatus, TranscriptionWord, UpdateTranscriptionRequest };
