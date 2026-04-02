/**
 * WAVE SDK - Transcribe API
 *
 * Audio and video transcription with speaker diarization.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
export * from './transcribe-types';
import type { CreateTranscriptionRequest, ListTranscriptionsParams, Speaker, TranscriptExportFormat, Transcription, TranscriptionModel, TranscriptionSegment, UpdateTranscriptionRequest } from './transcribe-types';
export declare class TranscribeAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a transcription job
     *
     * Requires: transcribe:create permission
     */
    create(request: CreateTranscriptionRequest): Promise<Transcription>;
    /**
     * Get a transcription by ID
     *
     * Requires: transcribe:read permission
     */
    get(transcriptionId: string): Promise<Transcription>;
    /**
     * Update a transcription
     *
     * Requires: transcribe:update permission
     */
    update(transcriptionId: string, request: UpdateTranscriptionRequest): Promise<Transcription>;
    /**
     * Remove a transcription
     *
     * Requires: transcribe:remove permission (server-side RBAC enforced)
     */
    remove(transcriptionId: string): Promise<void>;
    /**
     * List transcriptions
     *
     * Requires: transcribe:read permission
     */
    list(params?: ListTranscriptionsParams): Promise<PaginatedResponse<Transcription>>;
    /**
     * Get transcription segments
     *
     * Requires: transcribe:read permission
     */
    getSegments(transcriptionId: string, params?: PaginationParams & {
        start_time?: number;
        end_time?: number;
        speaker_id?: number;
    }): Promise<PaginatedResponse<TranscriptionSegment>>;
    /**
     * Update a segment
     *
     * Requires: transcribe:update permission
     */
    updateSegment(transcriptionId: string, segmentId: string, updates: {
        text?: string;
        speaker?: string;
        speaker_id?: number;
    }): Promise<TranscriptionSegment>;
    /**
     * Merge segments
     *
     * Requires: transcribe:update permission
     */
    mergeSegments(transcriptionId: string, segmentIds: string[]): Promise<TranscriptionSegment>;
    /**
     * Split a segment
     *
     * Requires: transcribe:update permission
     */
    splitSegment(transcriptionId: string, segmentId: string, splitTime: number): Promise<{
        first: TranscriptionSegment;
        second: TranscriptionSegment;
    }>;
    /**
     * Get speakers
     *
     * Requires: transcribe:read permission
     */
    getSpeakers(transcriptionId: string): Promise<Speaker[]>;
    /**
     * Update speaker label
     *
     * Requires: transcribe:update permission
     */
    updateSpeaker(transcriptionId: string, speakerId: number, label: string): Promise<Speaker>;
    /**
     * Merge speakers
     *
     * Requires: transcribe:update permission
     */
    mergeSpeakers(transcriptionId: string, speakerIds: number[], newLabel?: string): Promise<Speaker>;
    /**
     * Export transcription
     *
     * Requires: transcribe:read permission
     */
    exportTranscription(transcriptionId: string, format: TranscriptExportFormat, options?: {
        include_timestamps?: boolean;
        include_speakers?: boolean;
        paragraph_breaks?: boolean;
    }): Promise<{
        url: string;
        expires_at: string;
    }>;
    /**
     * Get plain text transcript
     *
     * Requires: transcribe:read permission
     */
    getText(transcriptionId: string, options?: {
        include_speakers?: boolean;
        paragraph_breaks?: boolean;
    }): Promise<string>;
    /**
     * Search within a transcription
     *
     * Requires: transcribe:read permission
     */
    search(transcriptionId: string, query: string, options?: {
        case_sensitive?: boolean;
        whole_word?: boolean;
    }): Promise<Array<{
        segment_id: string;
        text: string;
        start_time: number;
        end_time: number;
        highlight_ranges: Array<{
            start: number;
            end: number;
        }>;
    }>>;
    /**
     * Start real-time transcription
     *
     * Requires: transcribe:realtime permission
     */
    startRealtime(streamId: string, options?: {
        language?: string;
        model?: TranscriptionModel;
        speaker_diarization?: boolean;
    }): Promise<{
        session_id: string;
        websocket_url: string;
        expires_at: string;
    }>;
    /**
     * Stop real-time transcription
     *
     * Requires: transcribe:realtime permission
     */
    stopRealtime(sessionId: string): Promise<Transcription>;
    /**
     * Get real-time session status
     *
     * Requires: transcribe:read permission
     */
    getRealtimeStatus(sessionId: string): Promise<{
        status: 'active' | 'paused' | 'stopped';
        duration: number;
        word_count: number;
        segments_count: number;
    }>;
    /**
     * Wait for transcription to complete
     */
    waitForReady(transcriptionId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (transcription: Transcription) => void;
    }): Promise<Transcription>;
    /**
     * Detect language from audio
     *
     * Requires: transcribe:read permission
     */
    detectLanguage(sourceUrl: string): Promise<{
        detected_language: string;
        confidence: number;
        alternatives: Array<{
            language: string;
            confidence: number;
        }>;
    }>;
    /**
     * Get supported languages
     *
     * Requires: transcribe:read permission
     */
    getSupportedLanguages(): Promise<Array<{
        code: string;
        name: string;
        native_name: string;
        models: TranscriptionModel[];
    }>>;
    /**
     * Estimate transcription cost
     *
     * Requires: transcribe:read permission
     */
    estimateCost(durationSeconds: number, model?: TranscriptionModel, options?: {
        speaker_diarization?: boolean;
    }): Promise<{
        estimated_cost: number;
        currency: string;
        breakdown: Record<string, number>;
    }>;
}
/**
 * Create a Transcribe API instance
 */
export declare function createTranscribeAPI(client: WaveClient): TranscribeAPI;
