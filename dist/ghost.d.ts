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
/**
 * Directing autonomy level
 */
export type DirectingMode = "autonomous" | "assisted" | "manual";
/**
 * Production directing style preset
 */
export type DirectingStyle = "documentary" | "sports" | "talk_show" | "concert" | "conference" | "worship" | "custom";
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
    type: "speaker_priority" | "shot_variety" | "no_repeat" | "minimum_duration" | "audio_follow" | "custom";
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
export type AISuggestionType = "switch_source" | "change_layout" | "show_graphic" | "adjust_audio" | "start_recording";
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
export declare class GhostAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Start an Autopilot directing session
     *
     * Requires: ghost:create permission
     */
    start(request: StartGhostRequest): Promise<GhostSession>;
    /**
     * Get the current Autopilot session for a production
     *
     * Requires: ghost:read permission
     */
    get(productionId: string): Promise<GhostSession>;
    /**
     * Update an Autopilot session
     *
     * Requires: ghost:update permission
     */
    update(productionId: string, request: UpdateGhostRequest): Promise<GhostSession>;
    /**
     * Stop an Autopilot session
     *
     * Requires: ghost:stop permission
     */
    stop(productionId: string): Promise<GhostSession>;
    /**
     * Pause an Autopilot session
     *
     * Requires: ghost:update permission
     */
    pause(productionId: string): Promise<GhostSession>;
    /**
     * Resume a paused Autopilot session
     *
     * Requires: ghost:update permission
     */
    resume(productionId: string): Promise<GhostSession>;
    /**
     * Override the current shot with a manual selection
     *
     * Requires: ghost:override permission
     */
    override(productionId: string, override: ShotOverride): Promise<void>;
    /**
     * List AI suggestions for a production's Autopilot session
     *
     * Requires: ghost:read permission
     */
    listSuggestions(productionId: string, params?: PaginationParams): Promise<PaginatedResponse<AISuggestion>>;
    /**
     * Accept an AI suggestion
     *
     * Requires: ghost:update permission
     */
    acceptSuggestion(productionId: string, suggestionId: string): Promise<AISuggestion>;
    /**
     * Reject an AI suggestion
     *
     * Requires: ghost:update permission
     */
    rejectSuggestion(productionId: string, suggestionId: string): Promise<AISuggestion>;
    /**
     * Get directing statistics for a production's Autopilot session
     *
     * Requires: ghost:read permission
     */
    getStats(productionId: string): Promise<DirectingStats>;
}
/**
 * Create an Autopilot API instance
 */
export declare function createGhostAPI(client: WaveClient): GhostAPI;
