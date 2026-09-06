import { WaveClient } from './client.mjs';
import { GenerateCaptionsRequest, CaptionTrack, UploadCaptionsRequest, UpdateCaptionsRequest, ListCaptionsParams, CaptionCue, TranslateCaptionsRequest, CaptionFormat, BurnInCaptionsRequest, BurnInJob } from './captions-types.mjs';
export { CaptionStatus, CaptionStyle, CaptionWord } from './captions-types.mjs';
import { PaginatedResponse, PaginationParams } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Captions API
 *
 * Generate, manage, and translate captions for video content.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Caption status
 */
/**
 * Caption format
 */
/**
 * Caption track
 */
/**
 * Caption cue (single caption segment)
 */
/**
 * Word-level timing
 */
/**
 * Caption styling
 */
/**
 * Generate captions request
 */
/**
 * Upload captions request
 */
/**
 * Update captions request
 */
/**
 * Translate captions request
 */
/**
 * Burn-in captions request
 */
/**
 * Burn-in job
 */
/**
 * List captions params
 */
/**
 * Captions API client
 */
declare class CaptionsAPI {
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
declare function createCaptionsAPI(client: WaveClient): CaptionsAPI;

export { BurnInCaptionsRequest, BurnInJob, CaptionCue, CaptionFormat, CaptionTrack, CaptionsAPI, GenerateCaptionsRequest, ListCaptionsParams, TranslateCaptionsRequest, UpdateCaptionsRequest, UploadCaptionsRequest, createCaptionsAPI };
