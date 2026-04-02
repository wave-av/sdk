/**
 * WAVE SDK - Search API
 *
 * Search across media content using text, visual, and audio queries.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  Timestamps,
  Metadata,
} from './client';


// ============================================================================
// Types
// ============================================================================

/**
 * Search result type
 */
export type SearchResultType =
  | 'video'
  | 'audio'
  | 'clip'
  | 'stream'
  | 'transcript'
  | 'chapter';

/**
 * Search mode
 */
export type SearchMode =
  | 'text'
  | 'semantic'
  | 'visual'
  | 'audio'
  | 'multimodal';

/**
 * Sort order
 */
export type SearchSortOrder =
  | 'relevance'
  | 'created_at'
  | 'duration'
  | 'views'
  | 'engagement';

/**
 * Search result
 */
export interface SearchResult {
  id: string;
  type: SearchResultType;
  score: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration?: number;
  timestamp?: number;
  end_timestamp?: number;
  highlights: SearchHighlight[];
  metadata?: Metadata;
}

/**
 * Search highlight
 */
export interface SearchHighlight {
  field: string;
  text: string;
  ranges: Array<{ start: number; end: number }>;
}

/**
 * Search facet
 */
export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected: boolean;
  }>;
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  text: string;
  type: 'query' | 'content' | 'filter';
  score: number;
}

/**
 * Search request
 */
export interface SearchRequest {
  /** Search query */
  query: string;
  /** Search mode */
  mode?: SearchMode;
  /** Result types to include */
  types?: SearchResultType[];
  /** Filters */
  filters?: SearchFilters;
  /** Sort order */
  sort?: SearchSortOrder;
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Include facets */
  facets?: boolean;
  /** Facet fields */
  facet_fields?: string[];
  /** Pagination */
  limit?: number;
  offset?: number;
}

/**
 * Search filters
 */
export interface SearchFilters {
  /** Filter by organization */
  organization_id?: string;
  /** Filter by creator */
  creator_id?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by language */
  language?: string;
  /** Filter by duration range (seconds) */
  duration_min?: number;
  duration_max?: number;
  /** Filter by date range */
  created_after?: string;
  created_before?: string;
  /** Filter by content rating */
  content_rating?: string[];
  /** Filter by visibility */
  visibility?: 'public' | 'private' | 'unlisted';
  /** Custom metadata filters */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  has_more: boolean;
  took_ms: number;
  query_id: string;
  suggestions?: SearchSuggestion[];
  facets?: SearchFacet[];
  spell_correction?: string;
}

/**
 * Visual search request
 */
export interface VisualSearchRequest {
  /** Image URL to search with */
  image_url?: string;
  /** Base64 encoded image */
  image_base64?: string;
  /** Search for similar scenes */
  scene_similarity?: boolean;
  /** Search for objects */
  object_detection?: boolean;
  /** Search for faces */
  face_detection?: boolean;
  /** Search for text in images */
  ocr?: boolean;
  /** Filters */
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

/**
 * Audio search request
 */
export interface AudioSearchRequest {
  /** Audio URL to search with */
  audio_url?: string;
  /** Search for similar audio */
  audio_similarity?: boolean;
  /** Search for music */
  music_detection?: boolean;
  /** Search for speech */
  speech_detection?: boolean;
  /** Search for sound effects */
  sound_effects?: boolean;
  /** Filters */
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

/**
 * Index status
 */
export interface IndexStatus extends Timestamps {
  id: string;
  media_id: string;
  media_type: 'video' | 'audio' | 'clip' | 'stream';
  status: 'pending' | 'indexing' | 'ready' | 'failed';
  indexed_features: string[];
  progress?: number;
  error?: string;
}

// ============================================================================
// Search API
// ============================================================================

/**
 * Search API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { SearchAPI } from '@wave/sdk/search';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const search = new SearchAPI(client);
 *
 * // Text search
 * const results = await search.search({
 *   query: 'product demo',
 *   mode: 'semantic',
 *   types: ['video', 'clip'],
 * });
 *
 * // Visual search
 * const visualResults = await search.visualSearch({
 *   image_url: 'https://example.com/frame.jpg',
 *   scene_similarity: true,
 * });
 * ```
 */
