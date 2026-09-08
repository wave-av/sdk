// src/search.ts
var SearchAPI = class {
  client;
  basePath = "/v1/search";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Search
  // ==========================================================================
  /**
   * Search content
   *
   * Requires: search:query permission
   */
  async search(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Quick search (simplified API)
   *
   * Requires: search:query permission
   */
  async quickSearch(query, options) {
    const response = await this.search({
      query,
      mode: "semantic",
      types: options?.types,
      filters: options?.filters,
      limit: options?.limit || 10
    });
    return response.results;
  }
  /**
   * Search within a specific media
   *
   * Requires: search:query permission
   */
  async searchInMedia(mediaId, mediaType, query, options) {
    return this.client.post(`${this.basePath}/media`, {
      media_id: mediaId,
      media_type: mediaType,
      query,
      ...options
    });
  }
  // ==========================================================================
  // Visual Search
  // ==========================================================================
  /**
   * Visual search (search by image)
   *
   * Requires: search:visual permission
   */
  async visualSearch(request) {
    return this.client.post(`${this.basePath}/visual`, request);
  }
  /**
   * Find similar frames
   *
   * Requires: search:visual permission
   */
  async findSimilarFrames(mediaId, timestamp, options) {
    return this.client.post(`${this.basePath}/visual/similar`, {
      media_id: mediaId,
      timestamp,
      ...options
    });
  }
  /**
   * Detect objects in media
   *
   * Requires: search:visual permission
   */
  async detectObjects(mediaId, options) {
    return this.client.post(`${this.basePath}/visual/objects`, {
      media_id: mediaId,
      ...options
    });
  }
  // ==========================================================================
  // Audio Search
  // ==========================================================================
  /**
   * Audio search (search by audio)
   *
   * Requires: search:audio permission
   */
  async audioSearch(request) {
    return this.client.post(`${this.basePath}/audio`, request);
  }
  /**
   * Find similar audio segments
   *
   * Requires: search:audio permission
   */
  async findSimilarAudio(mediaId, startTime, endTime, options) {
    return this.client.post(`${this.basePath}/audio/similar`, {
      media_id: mediaId,
      start_time: startTime,
      end_time: endTime,
      ...options
    });
  }
  /**
   * Detect music in media
   *
   * Requires: search:audio permission
   */
  async detectMusic(mediaId) {
    return this.client.get(`${this.basePath}/audio/music/${mediaId}`);
  }
  // ==========================================================================
  // Suggestions
  // ==========================================================================
  /**
   * Get search suggestions
   *
   * Requires: search:query permission
   */
  async getSuggestions(prefix, options) {
    return this.client.get(`${this.basePath}/suggest`, {
      params: { prefix, ...options }
    });
  }
  /**
   * Get trending searches
   *
   * Requires: search:query permission
   */
  async getTrending(options) {
    return this.client.get(`${this.basePath}/trending`, { params: options });
  }
  // ==========================================================================
  // Indexing
  // ==========================================================================
  /**
   * Index media for search
   *
   * Requires: search:index permission
   */
  async indexMedia(mediaId, mediaType, options) {
    return this.client.post(`${this.basePath}/index`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options
    });
  }
  /**
   * Get index status
   *
   * Requires: search:read permission
   */
  async getIndexStatus(mediaId) {
    return this.client.get(`${this.basePath}/index/${mediaId}`);
  }
  /**
   * Reindex media
   *
   * Requires: search:index permission
   */
  async reindexMedia(mediaId, options) {
    return this.client.post(
      `${this.basePath}/index/${mediaId}/reindex`,
      options
    );
  }
  /**
   * Remove media from index
   *
   * Requires: search:index permission (server-side RBAC enforced)
   */
  async removeFromIndex(mediaId) {
    await this.client.delete(
      `${this.basePath}/index/${mediaId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Saved Searches
  // ==========================================================================
  /**
   * Save a search
   *
   * Requires: search:save permission
   */
  async saveSearch(name, request, options) {
    return this.client.post(`${this.basePath}/saved`, {
      name,
      query: request,
      ...options
    });
  }
  /**
   * List saved searches
   *
   * Requires: search:read permission
   */
  async listSavedSearches(params) {
    return this.client.get(`${this.basePath}/saved`, { params });
  }
  /**
   * Run a saved search
   *
   * Requires: search:query permission
   */
  async runSavedSearch(savedSearchId) {
    return this.client.post(
      `${this.basePath}/saved/${savedSearchId}/run`
    );
  }
  /**
   * Remove a saved search
   *
   * Requires: search:save permission (server-side RBAC enforced)
   */
  async removeSavedSearch(savedSearchId) {
    await this.client.delete(
      `${this.basePath}/saved/${savedSearchId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Analytics
  // ==========================================================================
  /**
   * Get search analytics
   *
   * Requires: search:analytics permission
   */
  async getAnalytics(options) {
    return this.client.get(`${this.basePath}/analytics`, { params: options });
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for indexing to complete
   */
  async waitForIndex(mediaId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const status = await this.getIndexStatus(mediaId);
      if (options?.onProgress) {
        options.onProgress(status);
      }
      if (status.status === "ready") {
        return status;
      }
      if (status.status === "failed") {
        throw new Error(`Indexing failed: ${status.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Indexing timed out after ${timeout}ms`);
  }
};
function createSearchAPI(client) {
  return new SearchAPI(client);
}

export {
  SearchAPI,
  createSearchAPI
};
