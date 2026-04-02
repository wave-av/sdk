/**
 * WAVE SDK - Search API
 *
 * Search across media content using text, visual, and audio queries.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
} from './client';

export * from './search-types';
import type {
  AudioSearchRequest,
  IndexStatus,
  SearchFilters,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchResultType,
  SearchSuggestion,
  VisualSearchRequest,
} from './search-types';

export class SearchAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/search';

  constructor(client: WaveClient) {
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
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.client.post<SearchResponse>(this.basePath, request);
  }

  /**
   * Quick search (simplified API)
   *
   * Requires: search:query permission
   */
  async quickSearch(
    query: string,
    options?: {
      types?: SearchResultType[];
      limit?: number;
      filters?: SearchFilters;
    }
  ): Promise<SearchResult[]> {
    const response = await this.search({
      query,
      mode: 'semantic',
      types: options?.types,
      filters: options?.filters,
      limit: options?.limit || 10,
    });
    return response.results;
  }

  /**
   * Search within a specific media
   *
   * Requires: search:query permission
   */
  async searchInMedia(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'clip' | 'stream',
    query: string,
    options?: { limit?: number }
  ): Promise<
    Array<{
      timestamp: number;
      end_timestamp?: number;
      text?: string;
      score: number;
      type: 'speech' | 'visual' | 'chapter';
    }>
  > {
    return this.client.post(`${this.basePath}/media`, {
      media_id: mediaId,
      media_type: mediaType,
      query,
      ...options,
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
  async visualSearch(request: VisualSearchRequest): Promise<SearchResponse> {
    return this.client.post<SearchResponse>(`${this.basePath}/visual`, request);
  }

  /**
   * Find similar frames
   *
   * Requires: search:visual permission
   */
  async findSimilarFrames(
    mediaId: string,
    timestamp: number,
    options?: { limit?: number; min_similarity?: number }
  ): Promise<
    Array<{
      media_id: string;
      media_type: string;
      timestamp: number;
      thumbnail_url: string;
      similarity: number;
    }>
  > {
    return this.client.post(`${this.basePath}/visual/similar`, {
      media_id: mediaId,
      timestamp,
      ...options,
    });
  }

  /**
   * Detect objects in media
   *
   * Requires: search:visual permission
   */
  async detectObjects(
    mediaId: string,
    options?: { timestamps?: number[]; confidence_threshold?: number }
  ): Promise<
    Array<{
      timestamp: number;
      objects: Array<{
        label: string;
        confidence: number;
        bounding_box: { x: number; y: number; width: number; height: number };
      }>;
    }>
  > {
    return this.client.post(`${this.basePath}/visual/objects`, {
      media_id: mediaId,
      ...options,
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
  async audioSearch(request: AudioSearchRequest): Promise<SearchResponse> {
    return this.client.post<SearchResponse>(`${this.basePath}/audio`, request);
  }

  /**
   * Find similar audio segments
   *
   * Requires: search:audio permission
   */
  async findSimilarAudio(
    mediaId: string,
    startTime: number,
    endTime: number,
    options?: { limit?: number; min_similarity?: number }
  ): Promise<
    Array<{
      media_id: string;
      media_type: string;
      start_time: number;
      end_time: number;
      similarity: number;
    }>
  > {
    return this.client.post(`${this.basePath}/audio/similar`, {
      media_id: mediaId,
      start_time: startTime,
      end_time: endTime,
      ...options,
    });
  }

  /**
   * Detect music in media
   *
   * Requires: search:audio permission
   */
  async detectMusic(
    mediaId: string
  ): Promise<
    Array<{
      start_time: number;
      end_time: number;
      confidence: number;
      music_info?: {
        title?: string;
        artist?: string;
        album?: string;
        isrc?: string;
      };
    }>
  > {
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
  async getSuggestions(
    prefix: string,
    options?: { limit?: number; types?: SearchResultType[] }
  ): Promise<SearchSuggestion[]> {
    return this.client.get<SearchSuggestion[]>(`${this.basePath}/suggest`, {
      params: { prefix, ...options } as unknown as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get trending searches
   *
   * Requires: search:query permission
   */
  async getTrending(
    options?: { limit?: number; timeframe?: 'hour' | 'day' | 'week' }
  ): Promise<Array<{ query: string; count: number; trend: number }>> {
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
  async indexMedia(
    mediaId: string,
    mediaType: 'video' | 'audio' | 'clip' | 'stream',
    options?: {
      features?: ('transcript' | 'visual' | 'audio' | 'metadata')[];
      priority?: 'low' | 'normal' | 'high';
      webhook_url?: string;
    }
  ): Promise<IndexStatus> {
    return this.client.post<IndexStatus>(`${this.basePath}/index`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options,
    });
  }

  /**
   * Get index status
   *
   * Requires: search:read permission
   */
  async getIndexStatus(mediaId: string): Promise<IndexStatus> {
    return this.client.get<IndexStatus>(`${this.basePath}/index/${mediaId}`);
  }

  /**
   * Reindex media
   *
   * Requires: search:index permission
   */
  async reindexMedia(
    mediaId: string,
    options?: { features?: ('transcript' | 'visual' | 'audio' | 'metadata')[] }
  ): Promise<IndexStatus> {
    return this.client.post<IndexStatus>(
      `${this.basePath}/index/${mediaId}/reindex`,
      options
    );
  }

  /**
   * Remove media from index
   *
   * Requires: search:index permission (server-side RBAC enforced)
   */
  async removeFromIndex(mediaId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/index/${mediaId}`,
      { method: 'DELETE' }
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
  async saveSearch(
    name: string,
    request: SearchRequest,
    options?: { notify_on_new?: boolean }
  ): Promise<{
    id: string;
    name: string;
    query: SearchRequest;
    created_at: string;
  }> {
    return this.client.post(`${this.basePath}/saved`, {
      name,
      query: request,
      ...options,
    });
  }

  /**
   * List saved searches
   *
   * Requires: search:read permission
   */
  async listSavedSearches(
    params?: PaginationParams
  ): Promise<
    PaginatedResponse<{
      id: string;
      name: string;
      query: SearchRequest;
      last_run?: string;
      new_results?: number;
    }>
  > {
    return this.client.get(`${this.basePath}/saved`, { params: params as Record<string, string | number | boolean | undefined> });
  }

  /**
   * Run a saved search
   *
   * Requires: search:query permission
   */
  async runSavedSearch(savedSearchId: string): Promise<SearchResponse> {
    return this.client.post<SearchResponse>(
      `${this.basePath}/saved/${savedSearchId}/run`
    );
  }

  /**
   * Remove a saved search
   *
   * Requires: search:save permission (server-side RBAC enforced)
   */
  async removeSavedSearch(savedSearchId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/saved/${savedSearchId}`,
      { method: 'DELETE' }
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
  async getAnalytics(
    options?: {
      start_date?: string;
      end_date?: string;
      group_by?: 'day' | 'week' | 'month';
    }
  ): Promise<{
    total_searches: number;
    unique_queries: number;
    zero_results_rate: number;
    average_results: number;
    top_queries: Array<{ query: string; count: number; avg_results: number }>;
    top_zero_results: Array<{ query: string; count: number }>;
  }> {
    return this.client.get(`${this.basePath}/analytics`, { params: options });
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for indexing to complete
   */
  async waitForIndex(
    mediaId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (status: IndexStatus) => void;
    }
  ): Promise<IndexStatus> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getIndexStatus(mediaId);

      if (options?.onProgress) {
        options.onProgress(status);
      }

      if (status.status === 'ready') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Indexing failed: ${status.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Indexing timed out after ${timeout}ms`);
  }
}

/**
 * Create a Search API instance
 */
export function createSearchAPI(client: WaveClient): SearchAPI {
  return new SearchAPI(client);
}
