// src/chapters.ts
var ChaptersAPI = class {
  client;
  basePath = "/v1/chapters";
  constructor(client) {
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
  async generate(request) {
    return this.client.post(`${this.basePath}/generate`, request);
  }
  /**
   * Create a chapter set manually
   *
   * Requires: chapters:create permission
   */
  async createSet(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a chapter set by ID
   *
   * Requires: chapters:read permission
   */
  async getSet(setId) {
    return this.client.get(`${this.basePath}/${setId}`);
  }
  /**
   * Update a chapter set
   *
   * Requires: chapters:update permission
   */
  async updateSet(setId, request) {
    return this.client.patch(`${this.basePath}/${setId}`, request);
  }
  /**
   * Remove a chapter set
   *
   * Requires: chapters:remove permission (canDelete verified server-side)
   */
  async removeSet(setId) {
    await this.client.delete(`${this.basePath}/${setId}`);
  }
  /**
   * List chapter sets
   *
   * Requires: chapters:read permission
   */
  async listSets(params) {
    return this.client.get(this.basePath, { params });
  }
  /**
   * Get the default chapter set for a media
   *
   * Requires: chapters:read permission
   */
  async getDefaultSet(mediaId, mediaType) {
    try {
      return await this.client.get(`${this.basePath}/default`, {
        params: { media_id: mediaId, media_type: mediaType }
      });
    } catch (error) {
      if (error.statusCode === 404) {
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
  async duplicateSet(setId, name) {
    return this.client.post(`${this.basePath}/${setId}/duplicate`, { name });
  }
  // ==========================================================================
  // Individual Chapters
  // ==========================================================================
  /**
   * Add a chapter to a set
   *
   * Requires: chapters:update permission
   */
  async addChapter(setId, chapter) {
    return this.client.post(`${this.basePath}/${setId}/chapters`, chapter);
  }
  /**
   * Get a chapter by ID
   *
   * Requires: chapters:read permission
   */
  async getChapter(setId, chapterId) {
    return this.client.get(`${this.basePath}/${setId}/chapters/${chapterId}`);
  }
  /**
   * Update a chapter
   *
   * Requires: chapters:update permission
   */
  async updateChapter(setId, chapterId, request) {
    return this.client.patch(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      request
    );
  }
  /**
   * Remove a chapter
   *
   * Requires: chapters:update permission (server-side RBAC enforced)
   */
  async removeChapter(setId, chapterId) {
    await this.client.delete(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Reorder chapters
   *
   * Requires: chapters:update permission
   */
  async reorderChapters(setId, chapterIds) {
    return this.client.post(
      `${this.basePath}/${setId}/chapters/reorder`,
      { chapter_ids: chapterIds }
    );
  }
  /**
   * Bulk update chapters
   *
   * Requires: chapters:update permission
   */
  async bulkUpdateChapters(setId, updates) {
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
  async generateThumbnail(setId, chapterId, options) {
    return this.client.post(
      `${this.basePath}/${setId}/chapters/${chapterId}/thumbnail`,
      options
    );
  }
  /**
   * Generate thumbnails for all chapters in a set
   *
   * Requires: chapters:update permission
   */
  async generateAllThumbnails(setId) {
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
  async exportChapters(setId, format) {
    return this.client.get(`${this.basePath}/${setId}/export`, {
      params: { format }
    });
  }
  /**
   * Import chapters from a format
   *
   * Requires: chapters:create permission
   */
  async importChapters(mediaId, mediaType, format, content, options) {
    return this.client.post(`${this.basePath}/import`, {
      media_id: mediaId,
      media_type: mediaType,
      format,
      content,
      ...options
    });
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for chapter generation to complete
   */
  async waitForReady(setId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const set = await this.getSet(setId);
      if (options?.onProgress) {
        options.onProgress(set);
      }
      if (set.status === "ready") {
        return set;
      }
      if (set.status === "failed") {
        throw new Error(`Chapter generation failed: ${set.error || "Unknown error"}`);
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
  async getChapterAtTime(setId, time) {
    try {
      return await this.client.get(`${this.basePath}/${setId}/at`, {
        params: { time }
      });
    } catch (error) {
      if (error.statusCode === 404) {
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
  async mergeChapters(setId, chapterIds, options) {
    return this.client.post(`${this.basePath}/${setId}/chapters/merge`, {
      chapter_ids: chapterIds,
      ...options
    });
  }
  /**
   * Split a chapter at a specific time
   *
   * Requires: chapters:update permission
   */
  async splitChapter(setId, chapterId, splitTime, options) {
    return this.client.post(`${this.basePath}/${setId}/chapters/${chapterId}/split`, {
      split_time: splitTime,
      ...options
    });
  }
};
function createChaptersAPI(client) {
  return new ChaptersAPI(client);
}

export {
  ChaptersAPI,
  createChaptersAPI
};
