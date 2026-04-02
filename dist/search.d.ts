/**
 * WAVE SDK - Search API
 *
 * Search across media content using text, visual, and audio queries.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
export * from './search-types';
import type { AudioSearchRequest, IndexStatus, SearchFilters, SearchRequest, SearchResponse, SearchResult, SearchResultType, SearchSuggestion, VisualSearchRequest } from './search-types';
export declare class SearchAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Search content
     *
     * Requires: search:query permission
     */
    search(request: SearchRequest): Promise<SearchResponse>;
    /**
     * Quick search (simplified API)
     *
     * Requires: search:query permission
     */
    quickSearch(query: string, options?: {
        types?: SearchResultType[];
        limit?: number;
        filters?: SearchFilters;
    }): Promise<SearchResult[]>;
    /**
     * Search within a specific media
     *
     * Requires: search:query permission
     */
    searchInMedia(mediaId: string, mediaType: 'video' | 'audio' | 'clip' | 'stream', query: string, options?: {
        limit?: number;
    }): Promise<Array<{
        timestamp: number;
        end_timestamp?: number;
        text?: string;
        score: number;
        type: 'speech' | 'visual' | 'chapter';
    }>>;
    /**
     * Visual search (search by image)
     *
     * Requires: search:visual permission
     */
    visualSearch(request: VisualSearchRequest): Promise<SearchResponse>;
    /**
     * Find similar frames
     *
     * Requires: search:visual permission
     */
    findSimilarFrames(mediaId: string, timestamp: number, options?: {
        limit?: number;
        min_similarity?: number;
    }): Promise<Array<{
        media_id: string;
        media_type: string;
        timestamp: number;
        thumbnail_url: string;
        similarity: number;
    }>>;
    /**
     * Detect objects in media
     *
     * Requires: search:visual permission
     */
    detectObjects(mediaId: string, options?: {
        timestamps?: number[];
        confidence_threshold?: number;
    }): Promise<Array<{
        timestamp: number;
        objects: Array<{
            label: string;
            confidence: number;
            bounding_box: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }>;
    }>>;
    /**
     * Audio search (search by audio)
     *
     * Requires: search:audio permission
     */
    audioSearch(request: AudioSearchRequest): Promise<SearchResponse>;
    /**
     * Find similar audio segments
     *
     * Requires: search:audio permission
     */
    findSimilarAudio(mediaId: string, startTime: number, endTime: number, options?: {
        limit?: number;
        min_similarity?: number;
    }): Promise<Array<{
        media_id: string;
        media_type: string;
        start_time: number;
        end_time: number;
        similarity: number;
    }>>;
    /**
     * Detect music in media
     *
     * Requires: search:audio permission
     */
    detectMusic(mediaId: string): Promise<Array<{
        start_time: number;
        end_time: number;
        confidence: number;
        music_info?: {
            title?: string;
            artist?: string;
            album?: string;
            isrc?: string;
        };
    }>>;
    /**
     * Get search suggestions
     *
     * Requires: search:query permission
     */
    getSuggestions(prefix: string, options?: {
        limit?: number;
        types?: SearchResultType[];
    }): Promise<SearchSuggestion[]>;
    /**
     * Get trending searches
     *
     * Requires: search:query permission
     */
    getTrending(options?: {
        limit?: number;
        timeframe?: 'hour' | 'day' | 'week';
    }): Promise<Array<{
        query: string;
        count: number;
        trend: number;
    }>>;
    /**
     * Index media for search
     *
     * Requires: search:index permission
     */
    indexMedia(mediaId: string, mediaType: 'video' | 'audio' | 'clip' | 'stream', options?: {
        features?: ('transcript' | 'visual' | 'audio' | 'metadata')[];
        priority?: 'low' | 'normal' | 'high';
        webhook_url?: string;
    }): Promise<IndexStatus>;
    /**
     * Get index status
     *
     * Requires: search:read permission
     */
    getIndexStatus(mediaId: string): Promise<IndexStatus>;
    /**
     * Reindex media
     *
     * Requires: search:index permission
     */
    reindexMedia(mediaId: string, options?: {
        features?: ('transcript' | 'visual' | 'audio' | 'metadata')[];
    }): Promise<IndexStatus>;
    /**
     * Remove media from index
     *
     * Requires: search:index permission (server-side RBAC enforced)
     */
    removeFromIndex(mediaId: string): Promise<void>;
    /**
     * Save a search
     *
     * Requires: search:save permission
     */
    saveSearch(name: string, request: SearchRequest, options?: {
        notify_on_new?: boolean;
    }): Promise<{
        id: string;
        name: string;
        query: SearchRequest;
        created_at: string;
    }>;
    /**
     * List saved searches
     *
     * Requires: search:read permission
     */
    listSavedSearches(params?: PaginationParams): Promise<PaginatedResponse<{
        id: string;
        name: string;
        query: SearchRequest;
        last_run?: string;
        new_results?: number;
    }>>;
    /**
     * Run a saved search
     *
     * Requires: search:query permission
     */
    runSavedSearch(savedSearchId: string): Promise<SearchResponse>;
    /**
     * Remove a saved search
     *
     * Requires: search:save permission (server-side RBAC enforced)
     */
    removeSavedSearch(savedSearchId: string): Promise<void>;
    /**
     * Get search analytics
     *
     * Requires: search:analytics permission
     */
    getAnalytics(options?: {
        start_date?: string;
        end_date?: string;
        group_by?: 'day' | 'week' | 'month';
    }): Promise<{
        total_searches: number;
        unique_queries: number;
        zero_results_rate: number;
        average_results: number;
        top_queries: Array<{
            query: string;
            count: number;
            avg_results: number;
        }>;
        top_zero_results: Array<{
            query: string;
            count: number;
        }>;
    }>;
    /**
     * Wait for indexing to complete
     */
    waitForIndex(mediaId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (status: IndexStatus) => void;
    }): Promise<IndexStatus>;
}
/**
 * Create a Search API instance
 */
export declare function createSearchAPI(client: WaveClient): SearchAPI;
