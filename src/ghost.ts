/**
 * WAVE SDK - Autopilot API (formerly Ghost Producer)
 *
 * AI-powered autonomous production directing. Start, control, and monitor
 * autonomous or assisted directing sessions for live productions.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

/**
 * Directing autonomy level
 */
export type DirectingMode = "autonomous" | "assisted" | "manual";

/**
 * Production directing style preset
 */
export type DirectingStyle =
  | "documentary"
  | "sports"
  | "talk_show"
  | "concert"
  | "conference"
  | "worship"
  | "custom";

/**
 * Autopilot directing session
 */
export interface GhostSession extends Timestamps {
  id: string;
  production_id: string;
  mode: DirectingMode;
  style: DirectingStyle;
  status: "active" | "paused" | "stopped";
  confidence_threshold: number;
  switch_interval_ms: number;
  rules: DirectingRule[];
  stats: DirectingStats;
  started_at: string;
  stopped_at?: string;
}

/**
 * Rule governing directing behavior
 */
export interface DirectingRule {
  type:
    | "speaker_priority"
    | "shot_variety"
    | "no_repeat"
    | "minimum_duration"
    | "audio_follow"
    | "custom";
  params: Record<string, unknown>;
  enabled: boolean;
  priority: number;
}

/**
 * Session directing statistics
 */
export interface DirectingStats {
  total_switches: number;
  auto_switches: number;
  manual_overrides: number;
  average_shot_duration_ms: number;
  speaker_changes_detected: number;
  audience_engagement_score: number;
}

/**
 * AI suggestion type
 */
export type AISuggestionType =
  | "switch_source"
  | "change_layout"
  | "show_graphic"
  | "adjust_audio"
  | "start_recording";

/**
 * AI-generated production suggestion
 */
export interface AISuggestion {
  id: string;
  session_id: string;
  type: AISuggestionType;
  confidence: number;
  description: string;
  action: Record<string, unknown>;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
}

/**
 * Manual shot override
 */
export interface ShotOverride {
  source_id: string;
  duration_ms: number;
  reason: string;
}

/**
 * Start an Autopilot session
 */
export interface StartGhostRequest {
  production_id: string;
  mode: DirectingMode;
  style: DirectingStyle;
  confidence_threshold?: number;
  switch_interval_ms?: number;
  rules?: DirectingRule[];
}

/**
 * Update an Autopilot session
 */
export interface UpdateGhostRequest {
  mode?: DirectingMode;
  style?: DirectingStyle;
  confidence_threshold?: number;
  switch_interval_ms?: number;
  rules?: DirectingRule[];
}

// ============================================================================
// Autopilot API
// ============================================================================

/**
 * Autopilot API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { GhostAPI } from '@wave/sdk/ghost';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const ghost = new GhostAPI(client);
 *
 * // Start autonomous directing for a production
 * const session = await ghost.start({
 *   production_id: 'prod_123',
 *   mode: 'autonomous',
 *   style: 'conference',
 *   confidence_threshold: 0.8,
 * });
 *
 * // Check AI suggestions
 * const suggestions = await ghost.listSuggestions('prod_123');
 * for (const suggestion of suggestions.data) {
 *   if (suggestion.confidence > 0.9) {
 *     await ghost.acceptSuggestion('prod_123', suggestion.id);
 *   }
 * }
 *
 * // Override with a manual shot
 * await ghost.override('prod_123', {
 *   source_id: 'cam_2',
 *   duration_ms: 5000,
 *   reason: 'Speaker moved to stage left',
 * });
 * ```
 */
export class GhostAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/productions";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Start an Autopilot directing session
   *
   * Requires: ghost:create permission
   */
  async start(request: StartGhostRequest): Promise<GhostSession> {
    return this.client.post<GhostSession>(
      `${this.basePath}/${request.production_id}/ghost`,
      request,
    );
  }

  /**
   * Get the current Autopilot session for a production
   *
   * Requires: ghost:read permission
   */
  async get(productionId: string): Promise<GhostSession> {
    return this.client.get<GhostSession>(`${this.basePath}/${productionId}/ghost`);
  }

  /**
   * Update an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async update(productionId: string, request: UpdateGhostRequest): Promise<GhostSession> {
    return this.client.patch<GhostSession>(`${this.basePath}/${productionId}/ghost`, request);
  }

  /**
   * Stop an Autopilot session
   *
   * Requires: ghost:stop permission
   */
  async stop(productionId: string): Promise<GhostSession> {
    return this.client.post<GhostSession>(`${this.basePath}/${productionId}/ghost/stop`);
  }

  /**
   * Pause an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async pause(productionId: string): Promise<GhostSession> {
    return this.client.post<GhostSession>(`${this.basePath}/${productionId}/ghost/pause`);
  }

  /**
   * Resume a paused Autopilot session
   *
   * Requires: ghost:update permission
   */
  async resume(productionId: string): Promise<GhostSession> {
    return this.client.post<GhostSession>(`${this.basePath}/${productionId}/ghost/resume`);
  }

  /**
   * Override the current shot with a manual selection
   *
   * Requires: ghost:override permission
   */
  async override(productionId: string, override: ShotOverride): Promise<void> {
    await this.client.post(`${this.basePath}/${productionId}/ghost/override`, override);
  }

  /**
   * List AI suggestions for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async listSuggestions(
    productionId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<AISuggestion>> {
    return this.client.get<PaginatedResponse<AISuggestion>>(
      `${this.basePath}/${productionId}/ghost/suggestions`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }

  /**
   * Accept an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async acceptSuggestion(productionId: string, suggestionId: string): Promise<AISuggestion> {
    return this.client.post<AISuggestion>(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/accept`,
    );
  }

  /**
   * Reject an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async rejectSuggestion(productionId: string, suggestionId: string): Promise<AISuggestion> {
    return this.client.post<AISuggestion>(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/reject`,
    );
  }

  /**
   * Get directing statistics for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async getStats(productionId: string): Promise<DirectingStats> {
    return this.client.get<DirectingStats>(`${this.basePath}/${productionId}/ghost/stats`);
  }
}

/**
 * Create an Autopilot API instance
 */
export function createGhostAPI(client: WaveClient): GhostAPI {
  return new GhostAPI(client);
}
