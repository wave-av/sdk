/**
 * WAVE SDK - Captions API
 *
 * Generate, manage, and translate captions for video content.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Caption status
 */
export type CaptionStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Caption format
 */
export type CaptionFormat = 'srt' | 'vtt' | 'sbv' | 'ass' | 'ttml' | 'dfxp' | 'json';
/**
 * Caption track
 */
export interface CaptionTrack extends Timestamps {
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
/**
 * Caption cue (single caption segment)
 */
export interface CaptionCue {
    id: string;
    start_time: number;
    end_time: number;
    text: string;
    speaker?: string;
    confidence?: number;
    words?: CaptionWord[];
    style?: CaptionStyle;
}
/**
 * Word-level timing
 */
export interface CaptionWord {
    word: string;
    start_time: number;
    end_time: number;
    confidence?: number;
}
/**
 * Caption styling
 */
export interface CaptionStyle {
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
/**
 * Generate captions request
 */
export interface GenerateCaptionsRequest {
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
/**
 * Upload captions request
 */
export interface UploadCaptionsRequest {
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
/**
 * Update captions request
 */
export interface UpdateCaptionsRequest {
    label?: string;
    is_default?: boolean;
    metadata?: Metadata;
}
/**
 * Translate captions request
 */
export interface TranslateCaptionsRequest {
    target_language: string;
    target_label?: string;
    /** Use professional translation */
    professional?: boolean;
    /** Preserve speaker labels */
    preserve_speakers?: boolean;
    webhook_url?: string;
}
/**
 * Burn-in captions request
 */
export interface BurnInCaptionsRequest {
    caption_track_id: string;
    style?: CaptionStyle;
    /** Output format */
    format?: 'mp4' | 'webm' | 'mov';
    /** Output quality */
    quality?: 'low' | 'medium' | 'high' | 'source';
    webhook_url?: string;
}
/**
 * Burn-in job
 */
export interface BurnInJob extends Timestamps {
    id: string;
    media_id: string;
    caption_track_id: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    progress: number;
    output_url?: string;
    error?: string;
}
/**
 * List captions params
 */
export interface ListCaptionsParams extends PaginationParams {
    media_id?: string;
    media_type?: 'video' | 'audio' | 'stream';
    language?: string;
    status?: CaptionStatus;
    is_auto_generated?: boolean;
}
/**
 * Captions API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { CaptionsAPI } from '@wave/sdk/captions';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const captions = new CaptionsAPI(client);
 *
 * // Generate captions for a video
 * const track = await captions.generate({
 *   media_id: 'video_123',
 *   media_type: 'video',
 *   language: 'en',
 *   speaker_diarization: true,
 * });
 *
 * // Wait for processing
 * const ready = await captions.waitForReady(track.id);
 *
 * // Translate to Spanish
 * const spanish = await captions.translate(track.id, {
 *   target_language: 'es',
 * });
 * ```
 */
export declare class CaptionsAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Generate captions using AI
     *
     * Requires: captions:generate permission
     */
    generate(request: GenerateCaptionsRequest): Promise<CaptionTrack>;
    /**
     * Upload existing captions
     *
     * Requires: captions:create permission
     */
    upload(request: UploadCaptionsRequest): Promise<CaptionTrack>;
    /**
     * Get a caption track by ID
     *
     * Requires: captions:read permission
     */
    get(trackId: string): Promise<CaptionTrack>;
    /**
     * Update a caption track
     *
     * Requires: captions:update permission
     */
    update(trackId: string, request: UpdateCaptionsRequest): Promise<CaptionTrack>;
    /**
     * Remove a caption track
     *
     * Requires: captions:remove permission (server-side RBAC enforced)
     */
    remove(trackId: string): Promise<void>;
    /**
     * List caption tracks
     *
     * Requires: captions:read permission
     */
    list(params?: ListCaptionsParams): Promise<PaginatedResponse<CaptionTrack>>;
    /**
     * Get caption tracks for a specific media
     *
     * Requires: captions:read permission
     */
    getForMedia(mediaId: string, mediaType: 'video' | 'audio' | 'stream'): Promise<CaptionTrack[]>;
    /**
     * Get caption cues (segments)
     *
     * Requires: captions:read permission
     */
    getCues(trackId: string, params?: PaginationParams & {
        start_time?: number;
        end_time?: number;
    }): Promise<PaginatedResponse<CaptionCue>>;
    /**
     * Update a caption cue
     *
     * Requires: captions:update permission
     */
    updateCue(trackId: string, cueId: string, updates: Partial<Pick<CaptionCue, 'text' | 'start_time' | 'end_time' | 'speaker' | 'style'>>): Promise<CaptionCue>;
    /**
     * Add a new caption cue
     *
     * Requires: captions:update permission
     */
    addCue(trackId: string, cue: Omit<CaptionCue, 'id' | 'confidence' | 'words'>): Promise<CaptionCue>;
    /**
     * Remove a caption cue
     *
     * Requires: captions:update permission (server-side RBAC enforced)
     */
    removeCue(trackId: string, cueId: string): Promise<void>;
    /**
     * Bulk update cues
     *
     * Requires: captions:update permission
     */
    bulkUpdateCues(trackId: string, updates: Array<{
        id: string;
        text?: string;
        start_time?: number;
        end_time?: number;
    }>): Promise<{
        updated: number;
    }>;
    /**
     * Translate a caption track to another language
     *
     * Requires: captions:translate permission
     */
    translate(trackId: string, request: TranslateCaptionsRequest): Promise<CaptionTrack>;
    /**
     * Export captions in a specific format
     *
     * Requires: captions:read permission
     */
    exportFormat(trackId: string, format: CaptionFormat): Promise<{
        url: string;
        expires_at: string;
    }>;
    /**
     * Get captions as plain text
     *
     * Requires: captions:read permission
     */
    getText(trackId: string): Promise<string>;
    /**
     * Burn captions into video
     *
     * Requires: captions:burnin permission
     */
    burnIn(request: BurnInCaptionsRequest): Promise<BurnInJob>;
    /**
     * Get burn-in job status
     *
     * Requires: captions:read permission
     */
    getBurnInJob(jobId: string): Promise<BurnInJob>;
    /**
     * Wait for burn-in to complete
     */
    waitForBurnIn(jobId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (job: BurnInJob) => void;
    }): Promise<BurnInJob>;
    /**
     * Wait for caption generation to complete
     */
    waitForReady(trackId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (track: CaptionTrack) => void;
    }): Promise<CaptionTrack>;
    /**
     * Get supported languages
     *
     * Requires: captions:read permission
     */
    getSupportedLanguages(): Promise<Array<{
        code: string;
        name: string;
        native_name: string;
        supports_generation: boolean;
        supports_translation: boolean;
    }>>;
    /**
     * Detect language from audio
     *
     * Requires: captions:generate permission
     */
    detectLanguage(mediaId: string, mediaType: 'video' | 'audio' | 'stream'): Promise<{
        detected_language: string;
        confidence: number;
        alternatives: Array<{
            language: string;
            confidence: number;
        }>;
    }>;
}
/**
 * Create a Captions API instance
 */
export declare function createCaptionsAPI(client: WaveClient): CaptionsAPI;
