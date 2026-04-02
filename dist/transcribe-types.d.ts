/**
 * WAVE SDK - Transcribe API
 *
 * Audio and video transcription with speaker diarization.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { PaginationParams, Timestamps, Metadata } from './client';
/**
 * Transcription status
 */
export type TranscriptionStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Transcription model
 */
export type TranscriptionModel = 'standard' | 'enhanced' | 'whisper-large' | 'whisper-medium' | 'medical' | 'legal';
/**
 * Transcription job
 */
export interface Transcription extends Timestamps {
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
export interface TranscriptionSegment {
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
export interface TranscriptionWord {
    word: string;
    start_time: number;
    end_time: number;
    confidence: number;
    speaker_id?: number;
}
/**
 * Speaker info
 */
export interface Speaker {
    id: number;
    label: string;
    segments_count: number;
    total_duration: number;
    confidence?: number;
}
/**
 * Create transcription request
 */
export interface CreateTranscriptionRequest {
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
export interface UpdateTranscriptionRequest {
    metadata?: Metadata;
}
/**
 * List transcriptions params
 */
export interface ListTranscriptionsParams extends PaginationParams {
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
export type TranscriptExportFormat = 'txt' | 'json' | 'srt' | 'vtt' | 'docx' | 'pdf';
/**
 * Transcribe API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { TranscribeAPI } from '@wave/sdk/transcribe';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const transcribe = new TranscribeAPI(client);
 *
 * // Transcribe a video
 * const job = await transcribe.create({
 *   source_url: 'https://example.com/video.mp4',
 *   source_type: 'url',
 *   language: 'en',
 *   speaker_diarization: true,
 * });
 *
 * // Wait for completion
 * const result = await transcribe.waitForReady(job.id);
 *
 * // Get the transcript
 * const segments = await transcribe.getSegments(result.id);
 * ```
 */
