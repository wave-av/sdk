/**
 * WAVE SDK - Clips API
 *
 * Create, manage, and export video clips from streams and recordings.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Clip status
 */
export type ClipStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
/**
 * Clip export format
 */
export type ClipExportFormat = 'mp4' | 'webm' | 'mov' | 'gif' | 'mp3' | 'wav';
/**
 * Clip quality preset
 */
export type ClipQualityPreset = 'low' | 'medium' | 'high' | 'source' | 'custom';
/**
 * Clip source reference
 */
export interface ClipSource {
    type: 'stream' | 'recording' | 'upload';
    id: string;
    start_time: number;
    end_time: number;
}
/**
 * Clip object
 */
export interface Clip extends Timestamps {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    source: ClipSource;
    status: ClipStatus;
    duration: number;
    thumbnail_url?: string;
    playback_url?: string;
    download_url?: string;
    file_size?: number;
    width?: number;
    height?: number;
    frame_rate?: number;
    bitrate?: number;
    codec?: string;
    tags?: string[];
    metadata?: Metadata;
    error?: string;
}
/**
 * Create clip request
 */
export interface CreateClipRequest {
    title: string;
    description?: string;
    source: ClipSource;
    quality?: ClipQualityPreset;
    format?: ClipExportFormat;
    tags?: string[];
    metadata?: Metadata;
    /** Enable AI-powered highlight detection */
    auto_highlights?: boolean;
    /** Webhook URL for status updates */
    webhook_url?: string;
}
/**
 * Update clip request
 */
export interface UpdateClipRequest {
    title?: string;
    description?: string;
    tags?: string[];
    metadata?: Metadata;
}
/**
 * List clips filters
 */
export interface ListClipsParams extends PaginationParams {
    status?: ClipStatus;
    source_type?: 'stream' | 'recording' | 'upload';
    source_id?: string;
    tags?: string[];
    created_after?: string;
    created_before?: string;
    order_by?: 'created_at' | 'duration' | 'title';
    order?: 'asc' | 'desc';
}
/**
 * Export clip request
 */
export interface ExportClipRequest {
    format: ClipExportFormat;
    quality?: ClipQualityPreset;
    /** Custom resolution (e.g., "1920x1080") */
    resolution?: string;
    /** Custom bitrate in kbps */
    bitrate?: number;
    /** Include audio */
    include_audio?: boolean;
    /** Add watermark */
    watermark?: {
        image_url: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        opacity?: number;
        scale?: number;
    };
}
/**
 * Export job status
 */
export interface ClipExport extends Timestamps {
    id: string;
    clip_id: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    format: ClipExportFormat;
    download_url?: string;
    file_size?: number;
    expires_at?: string;
    error?: string;
}
/**
 * Auto-highlight result
 */
export interface ClipHighlight {
    start_time: number;
    end_time: number;
    score: number;
    type: 'action' | 'speech' | 'emotion' | 'custom';
    label?: string;
}
/**
 * Clips API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { ClipsAPI } from '@wave/sdk/clips';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const clips = new ClipsAPI(client);
 *
 * // Create a clip from a stream
 * const clip = await clips.create({
 *   title: 'Best Moment',
 *   source: {
 *     type: 'stream',
 *     id: 'stream_123',
 *     start_time: 120,
 *     end_time: 150,
 *   },
 * });
 *
 * // Wait for processing
 * const ready = await clips.waitForReady(clip.id);
 * console.log('Clip ready:', ready.playback_url);
 * ```
 */
export declare class ClipsAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a new clip
     *
     * Requires: clips:create permission
     */
    create(request: CreateClipRequest): Promise<Clip>;
    /**
     * Get a clip by ID
     *
     * Requires: clips:read permission
     */
    get(clipId: string): Promise<Clip>;
    /**
     * Update a clip
     *
     * Requires: clips:update permission
     */
    update(clipId: string, request: UpdateClipRequest): Promise<Clip>;
    /**
     * Remove a clip
     *
     * Requires: clips:remove permission (server-side RBAC enforced)
     */
    remove(clipId: string): Promise<void>;
    /**
     * List clips with optional filters
     *
     * Requires: clips:read permission
     */
    list(params?: ListClipsParams): Promise<PaginatedResponse<Clip>>;
    /**
     * Export a clip to a different format
     *
     * Requires: clips:export permission
     */
    exportClip(clipId: string, request: ExportClipRequest): Promise<ClipExport>;
    /**
     * Get export job status
     *
     * Requires: clips:read permission
     */
    getExport(clipId: string, exportId: string): Promise<ClipExport>;
    /**
     * List all exports for a clip
     *
     * Requires: clips:read permission
     */
    listExports(clipId: string, params?: PaginationParams): Promise<PaginatedResponse<ClipExport>>;
    /**
     * Detect highlights in source content
     *
     * Requires: clips:analyze permission
     */
    detectHighlights(sourceType: 'stream' | 'recording', sourceId: string, options?: {
        types?: ('action' | 'speech' | 'emotion')[];
        min_score?: number;
        max_results?: number;
    }): Promise<ClipHighlight[]>;
    /**
     * Generate clips from detected highlights
     *
     * Requires: clips:create permission
     */
    createFromHighlights(sourceType: 'stream' | 'recording', sourceId: string, options?: {
        min_score?: number;
        max_clips?: number;
        title_prefix?: string;
        tags?: string[];
    }): Promise<Clip[]>;
    /**
     * Wait for a clip to be ready
     */
    waitForReady(clipId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (clip: Clip) => void;
    }): Promise<Clip>;
    /**
     * Wait for an export to be ready
     */
    waitForExport(clipId: string, exportId: string, options?: {
        pollInterval?: number;
        timeout?: number;
    }): Promise<ClipExport>;
}
/**
 * Create a Clips API instance
 */
export declare function createClipsAPI(client: WaveClient): ClipsAPI;
