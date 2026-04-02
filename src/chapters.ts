/**
 * WAVE SDK - Chapters API
 *
 * Manage video chapters and smart chapter generation.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from './client';
import type { ChapterStatus, Chapter, ChapterSet, GenerateChaptersRequest, CreateChapterSetRequest, CreateChapterRequest, UpdateChapterRequest, UpdateChapterSetRequest, ListChapterSetsParams } from './chapters-types';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Chapters API
// ============================================================================

/**
 * Chapters API client
 */
export class ChaptersAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/chapters';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Chapter Sets
  // ==========================================================================

  /**
   * Generate chapters using AI
   *
   * Requires: chapters:generate permission
   */
  async generate(request: GenerateChaptersRequest): Promise<ChapterSet> {
    return this.client.post<ChapterSet>(`${this.basePath}/generate`, request);
  }

  /**
   * Create a chapter set manually
   *
   * Requires: chapters:create permission
   */
  async createSet(request: CreateChapterSetRequest): Promise<ChapterSet> {
    return this.client.post<ChapterSet>(this.basePath, request);
  }

  /**
   * Get a chapter set by ID
   *
   * Requires: chapters:read permission
   */
  async getSet(setId: string): Promise<ChapterSet> {
    return this.client.get<ChapterSet>(`${this.basePath}/${setId}`);
  }

  /**
   * Update a chapter set
   *
   * Requires: chapters:update permission
   */
  async updateSet(setId: string, request: UpdateChapterSetRequest): Promise<ChapterSet> {
    return this.client.patch<ChapterSet>(`${this.basePath}/${setId}`, request);
  }

  /**
   * Remove a chapter set
   *
   * Requires: chapters:remove permission (canDelete verified server-side)
   */
  async removeSet(setId: string): Promise<void> {
    // canDelete permission enforced by API
    await this.client.delete(`${this.basePath}/${setId}`);
  }

  /**
   * List chapter sets
   *
   * Requires: chapters:read permission
   */
  async listSets(params?: ListChapterSetsParams): Promise<PaginatedResponse<ChapterSet>> {
    return this.client.get<PaginatedResponse<ChapterSet>>(this.basePath, { params: params as Record<string, string | number | boolean | undefined> });
  }

  /**
   * Get the default chapter set for a media
   *
   * Requires: chapters:read permission
   */
  async getDefaultSet(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'stream'
  ): Promise<ChapterSet | null> {
    try {
      return await this.client.get<ChapterSet>(`${this.basePath}/default`, {
        params: { media_id: mediaId, media_type: mediaType } as unknown as Record<string, string | number | boolean | undefined>,
      });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Duplicate a chapter set
   *
   * Requires: chapters:create permission
   */
  async duplicateSet(setId: string, name?: string): Promise<ChapterSet> {
    return this.client.post<ChapterSet>(`${this.basePath}/${setId}/duplicate`, { name });
  }

  // ==========================================================================
  // Individual Chapters
  // ==========================================================================

  /**
   * Add a chapter to a set
   *
   * Requires: chapters:update permission
   */
  async addChapter(setId: string, chapter: CreateChapterRequest): Promise<Chapter> {
    return this.client.post<Chapter>(`${this.basePath}/${setId}/chapters`, chapter);
  }

  /**
   * Get a chapter by ID
   *
   * Requires: chapters:read permission
   */
  async getChapter(setId: string, chapterId: string): Promise<Chapter> {
    return this.client.get<Chapter>(`${this.basePath}/${setId}/chapters/${chapterId}`);
  }

  /**
   * Update a chapter
   *
   * Requires: chapters:update permission
   */
  async updateChapter(
    setId: string,
    chapterId: string,
    request: UpdateChapterRequest
  ): Promise<Chapter> {
    return this.client.patch<Chapter>(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      request
    );
  }

  /**
   * Remove a chapter
   *
   * Requires: chapters:update permission (server-side RBAC enforced)
   */
  async removeChapter(setId: string, chapterId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Reorder chapters
   *
   * Requires: chapters:update permission
   */
  async reorderChapters(
    setId: string,
    chapterIds: string[]
  ): Promise<ChapterSet> {
    return this.client.post<ChapterSet>(
      `${this.basePath}/${setId}/chapters/reorder`,
      { chapter_ids: chapterIds }
    );
  }

  /**
   * Bulk update chapters
   *
   * Requires: chapters:update permission
   */
  async bulkUpdateChapters(
    setId: string,
    updates: Array<{ id: string } & Partial<UpdateChapterRequest>>
  ): Promise<{ updated: number }> {
    return this.client.post(`${this.basePath}/${setId}/chapters/bulk`, { updates });
  }

  // ==========================================================================
  // Thumbnails
  // ==========================================================================

  /**
   * Generate thumbnail for a chapter
   *
   * Requires: chapters:update permission
   */
  async generateThumbnail(
    setId: string,
    chapterId: string,
    options?: { time?: number }
  ): Promise<Chapter> {
    return this.client.post<Chapter>(
      `${this.basePath}/${setId}/chapters/${chapterId}/thumbnail`,
      options
    );
  }

  /**
   * Generate thumbnails for all chapters in a set
   *
   * Requires: chapters:update permission
   */
  async generateAllThumbnails(setId: string): Promise<{ generated: number }> {
    return this.client.post(`${this.basePath}/${setId}/thumbnails`);
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Export chapters in various formats
   *
   * Requires: chapters:read permission
   */
  async exportChapters(
    setId: string,
    format: 'json' | 'youtube' | 'webvtt' | 'ffmpeg'
  ): Promise<{ content: string; format: string }> {
    return this.client.get(`${this.basePath}/${setId}/export`, {
      params: { format } as unknown as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Import chapters from a format
   *
   * Requires: chapters:create permission
   */
  async importChapters(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'stream',
    format: 'json' | 'youtube' | 'webvtt' | 'ffmpeg',
    content: string,
    options?: { name?: string; set_as_default?: boolean }
  ): Promise<ChapterSet> {
    return this.client.post<ChapterSet>(`${this.basePath}/import`, {
      media_id: mediaId,
      media_type: mediaType,
      format,
      content,
      ...options,
    });
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for chapter generation to complete
   */
  async waitForReady(
    setId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (set: ChapterSet) => void;
    }
  ): Promise<ChapterSet> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const set = await this.getSet(setId);

      if (options?.onProgress) {
        options.onProgress(set);
      }

      if (set.status === 'ready') {
        return set;
      }

      if (set.status === 'failed') {
        throw new Error(`Chapter generation failed: ${set.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Chapter generation timed out after ${timeout}ms`);
  }

  /**
   * Get chapter at a specific time
   *
   * Requires: chapters:read permission
   */
  async getChapterAtTime(setId: string, time: number): Promise<Chapter | null> {
    try {
      return await this.client.get<Chapter>(`${this.basePath}/${setId}/at`, {
        params: { time } as unknown as Record<string, string | number | boolean | undefined>,
      });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Merge chapters
   *
   * Requires: chapters:update permission
   */
  async mergeChapters(
    setId: string,
    chapterIds: string[],
    options?: { title?: string; description?: string }
  ): Promise<Chapter> {
    return this.client.post<Chapter>(`${this.basePath}/${setId}/chapters/merge`, {
      chapter_ids: chapterIds,
      ...options,
    });
  }

  /**
   * Split a chapter at a specific time
   *
   * Requires: chapters:update permission
   */
  async splitChapter(
    setId: string,
    chapterId: string,
    splitTime: number,
    options?: { first_title?: string; second_title?: string }
  ): Promise<{ first: Chapter; second: Chapter }> {
    return this.client.post(`${this.basePath}/${setId}/chapters/${chapterId}/split`, {
      split_time: splitTime,
      ...options,
    });
  }
}

/**
 * Create a Chapters API instance
 */
export function createChaptersAPI(client: WaveClient): ChaptersAPI {
  return new ChaptersAPI(client);
}
