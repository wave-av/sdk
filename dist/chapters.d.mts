import { WaveClient } from './client.mjs';
import { GenerateChaptersRequest, ChapterSet, CreateChapterSetRequest, UpdateChapterSetRequest, ListChapterSetsParams, CreateChapterRequest, Chapter, UpdateChapterRequest } from './chapters-types.mjs';
export { ChapterStatus } from './chapters-types.mjs';
import { PaginatedResponse } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Chapters API
 *
 * Manage video chapters and smart chapter generation.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Chapter status
 */
/**
 * Chapter
 */
/**
 * Chapter set (collection of chapters for a media)
 */
/**
 * Generate chapters request
 */
/**
 * Create chapter set request
 */
/**
 * Create chapter request
 */
/**
 * Update chapter request
 */
/**
 * Update chapter set request
 */
/**
 * List chapter sets params
 */
/**
 * Chapters API client
 */
declare class ChaptersAPI {
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
declare function createChaptersAPI(client: WaveClient): ChaptersAPI;

export { Chapter, ChapterSet, ChaptersAPI, CreateChapterRequest, CreateChapterSetRequest, GenerateChaptersRequest, ListChapterSetsParams, UpdateChapterRequest, UpdateChapterSetRequest, createChaptersAPI };
