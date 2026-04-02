/**
 * WAVE SDK - Chapters API
 *
 * Manage video chapters and smart chapter generation.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Chapter status
 */
export type ChapterStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Chapter
 */
export interface Chapter extends Timestamps {
    id: string;
    media_id: string;
    title: string;
    description?: string;
    start_time: number;
    end_time?: number;
    thumbnail_url?: string;
    order: number;
    is_auto_generated: boolean;
    confidence?: number;
    metadata?: Metadata;
}
/**
 * Chapter set (collection of chapters for a media)
 */
export interface ChapterSet extends Timestamps {
    id: string;
    organization_id: string;
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name: string;
    status: ChapterStatus;
    is_default: boolean;
    is_auto_generated: boolean;
    chapters: Chapter[];
    chapter_count: number;
    error?: string;
    metadata?: Metadata;
}
/**
 * Generate chapters request
 */
export interface GenerateChaptersRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name?: string;
    /** Minimum chapter duration in seconds */
    min_duration?: number;
    /** Maximum number of chapters */
    max_chapters?: number;
    /** Detection method */
    method?: 'scene' | 'topic' | 'combined';
    /** Use transcript for topic detection */
    use_transcript?: boolean;
    /** Caption track ID if using transcript */
    caption_track_id?: string;
    /** Generate thumbnails for chapters */
    generate_thumbnails?: boolean;
    /** Set as default chapter set */
    set_as_default?: boolean;
    /** Webhook URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
/**
 * Create chapter set request
 */
export interface CreateChapterSetRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name: string;
    chapters: CreateChapterRequest[];
    set_as_default?: boolean;
    metadata?: Metadata;
}
/**
 * Create chapter request
 */
export interface CreateChapterRequest {
    title: string;
    description?: string;
    start_time: number;
    end_time?: number;
    thumbnail_url?: string;
    metadata?: Metadata;
}
/**
 * Update chapter request
 */
export interface UpdateChapterRequest {
    title?: string;
    description?: string;
    start_time?: number;
    end_time?: number;
    thumbnail_url?: string;
    order?: number;
    metadata?: Metadata;
}
/**
 * Update chapter set request
 */
export interface UpdateChapterSetRequest {
    name?: string;
    is_default?: boolean;
    metadata?: Metadata;
}
/**
 * List chapter sets params
 */
export interface ListChapterSetsParams extends PaginationParams {
    media_id?: string;
    media_type?: 'video' | 'audio' | 'stream';
    status?: ChapterStatus;
    is_auto_generated?: boolean;
}
/**
 * Chapters API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { ChaptersAPI } from '@wave/sdk/chapters';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const chapters = new ChaptersAPI(client);
 *
 * // Generate chapters automatically
 * const chapterSet = await chapters.generate({
 *   media_id: 'video_123',
 *   media_type: 'video',
 *   method: 'combined',
 *   generate_thumbnails: true,
 * });
 *
 * // Wait for processing
 * const ready = await chapters.waitForReady(chapterSet.id);
 * console.log('Chapters:', ready.chapters);
 * ```
 */
export declare class ChaptersAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Generate chapters using AI
     *
     * Requires: chapters:generate permission
     */
    generate(request: GenerateChaptersRequest): Promise<ChapterSet>;
    /**
     * Create a chapter set manually
     *
     * Requires: chapters:create permission
     */
    createSet(request: CreateChapterSetRequest): Promise<ChapterSet>;
    /**
     * Get a chapter set by ID
     *
     * Requires: chapters:read permission
     */
    getSet(setId: string): Promise<ChapterSet>;
    /**
     * Update a chapter set
     *
     * Requires: chapters:update permission
     */
    updateSet(setId: string, request: UpdateChapterSetRequest): Promise<ChapterSet>;
    /**
     * Remove a chapter set
     *
     * Requires: chapters:remove permission (canDelete verified server-side)
     */
    removeSet(setId: string): Promise<void>;
    /**
     * List chapter sets
     *
     * Requires: chapters:read permission
     */
    listSets(params?: ListChapterSetsParams): Promise<PaginatedResponse<ChapterSet>>;
    /**
     * Get the default chapter set for a media
     *
     * Requires: chapters:read permission
     */
    getDefaultSet(mediaId: string, mediaType: 'video' | 'audio' | 'stream'): Promise<ChapterSet | null>;
    /**
     * Duplicate a chapter set
     *
     * Requires: chapters:create permission
     */
    duplicateSet(setId: string, name?: string): Promise<ChapterSet>;
    /**
     * Add a chapter to a set
     *
     * Requires: chapters:update permission
     */
    addChapter(setId: string, chapter: CreateChapterRequest): Promise<Chapter>;
    /**
     * Get a chapter by ID
     *
     * Requires: chapters:read permission
     */
    getChapter(setId: string, chapterId: string): Promise<Chapter>;
    /**
     * Update a chapter
     *
     * Requires: chapters:update permission
     */
    updateChapter(setId: string, chapterId: string, request: UpdateChapterRequest): Promise<Chapter>;
    /**
     * Remove a chapter
     *
     * Requires: chapters:update permission (server-side RBAC enforced)
     */
    removeChapter(setId: string, chapterId: string): Promise<void>;
    /**
     * Reorder chapters
     *
     * Requires: chapters:update permission
     */
    reorderChapters(setId: string, chapterIds: string[]): Promise<ChapterSet>;
    /**
     * Bulk update chapters
     *
     * Requires: chapters:update permission
     */
    bulkUpdateChapters(setId: string, updates: Array<{
        id: string;
    } & Partial<UpdateChapterRequest>>): Promise<{
        updated: number;
    }>;
    /**
     * Generate thumbnail for a chapter
     *
     * Requires: chapters:update permission
     */
    generateThumbnail(setId: string, chapterId: string, options?: {
        time?: number;
    }): Promise<Chapter>;
    /**
     * Generate thumbnails for all chapters in a set
     *
     * Requires: chapters:update permission
     */
    generateAllThumbnails(setId: string): Promise<{
        generated: number;
    }>;
    /**
     * Export chapters in various formats
     *
     * Requires: chapters:read permission
     */
    exportChapters(setId: string, format: 'json' | 'youtube' | 'webvtt' | 'ffmpeg'): Promise<{
        content: string;
        format: string;
    }>;
    /**
     * Import chapters from a format
     *
     * Requires: chapters:create permission
     */
    importChapters(mediaId: string, mediaType: 'video' | 'audio' | 'stream', format: 'json' | 'youtube' | 'webvtt' | 'ffmpeg', content: string, options?: {
        name?: string;
        set_as_default?: boolean;
    }): Promise<ChapterSet>;
    /**
     * Wait for chapter generation to complete
     */
    waitForReady(setId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (set: ChapterSet) => void;
    }): Promise<ChapterSet>;
    /**
     * Get chapter at a specific time
     *
     * Requires: chapters:read permission
     */
    getChapterAtTime(setId: string, time: number): Promise<Chapter | null>;
    /**
     * Merge chapters
     *
     * Requires: chapters:update permission
     */
    mergeChapters(setId: string, chapterIds: string[], options?: {
        title?: string;
        description?: string;
    }): Promise<Chapter>;
    /**
     * Split a chapter at a specific time
     *
     * Requires: chapters:update permission
     */
    splitChapter(setId: string, chapterId: string, splitTime: number, options?: {
        first_title?: string;
        second_title?: string;
    }): Promise<{
        first: Chapter;
        second: Chapter;
    }>;
}
/**
 * Create a Chapters API instance
 */
export declare function createChaptersAPI(client: WaveClient): ChaptersAPI;
