/**
 * WAVE SDK - Studio AI API
 *
 * AI-powered production assistance for live streaming and video production.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { PaginationParams, Timestamps, Metadata } from './client';
/**
 * AI assistant mode
 */
export type AssistantMode = 'auto_director' | 'graphics_operator' | 'audio_mixer' | 'replay_operator' | 'content_moderator' | 'engagement_manager';
/**
 * AI suggestion priority
 */
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';
/**
 * AI suggestion status
 */
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'applied' | 'expired';
/**
 * AI assistant
 */
export interface AIAssistant extends Timestamps {
    id: string;
    organization_id: string;
    stream_id: string;
    mode: AssistantMode;
    status: 'active' | 'paused' | 'stopped';
    config: AssistantConfig;
    stats: AssistantStats;
    metadata?: Metadata;
}
/**
 * Assistant configuration
 */
export interface AssistantConfig {
    /** Automation level (0-100) */
    automation_level: number;
    /** Enable auto-apply for suggestions */
    auto_apply: boolean;
    /** Auto-apply confidence threshold (0-1) */
    confidence_threshold: number;
    /** Mode-specific settings */
    settings: Record<string, unknown>;
}
/**
 * Assistant statistics
 */
export interface AssistantStats {
    suggestions_made: number;
    suggestions_accepted: number;
    suggestions_rejected: number;
    auto_applied: number;
    average_confidence: number;
    uptime_seconds: number;
}
/**
 * AI suggestion
 */
export interface AISuggestion extends Timestamps {
    id: string;
    assistant_id: string;
    stream_id: string;
    mode: AssistantMode;
    type: string;
    title: string;
    description: string;
    priority: SuggestionPriority;
    status: SuggestionStatus;
    confidence: number;
    action: SuggestionAction;
    preview_url?: string;
    expires_at?: string;
    applied_at?: string;
    metadata?: Metadata;
}
/**
 * Suggestion action
 */
export interface SuggestionAction {
    type: string;
    target?: string;
    params: Record<string, unknown>;
}
/**
 * Auto-director scene recommendation
 */
export interface SceneRecommendation {
    scene_id: string;
    scene_name: string;
    confidence: number;
    reason: string;
    triggers: string[];
}
/**
 * Graphics suggestion
 */
export interface GraphicsSuggestion {
    graphic_type: 'lower_third' | 'full_screen' | 'overlay' | 'bug';
    template_id?: string;
    content: Record<string, string>;
    duration?: number;
    position?: {
        x: number;
        y: number;
    };
}
/**
 * Audio mix suggestion
 */
export interface AudioMixSuggestion {
    source_id: string;
    source_name: string;
    action: 'raise' | 'lower' | 'mute' | 'unmute' | 'solo';
    target_level?: number;
    reason: string;
}
/**
 * Content moderation alert
 */
export interface ModerationAlert {
    type: 'inappropriate_content' | 'copyright' | 'spam' | 'hate_speech' | 'violence';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: 'video' | 'audio' | 'chat';
    description: string;
    timestamp?: number;
    frame_url?: string;
}
/**
 * Engagement insight
 */
export interface EngagementInsight {
    type: 'peak_moment' | 'drop_off' | 'chat_spike' | 'reaction_surge';
    metric: string;
    value: number;
    change: number;
    timestamp: number;
    suggestion?: string;
}
/**
 * Start assistant request
 */
export interface StartAssistantRequest {
    stream_id: string;
    mode: AssistantMode;
    config?: Partial<AssistantConfig>;
    metadata?: Metadata;
}
/**
 * Update assistant request
 */
export interface UpdateAssistantRequest {
    config?: Partial<AssistantConfig>;
    status?: 'active' | 'paused';
    metadata?: Metadata;
}
/**
 * List suggestions params
 */
export interface ListSuggestionsParams extends PaginationParams {
    assistant_id?: string;
    stream_id?: string;
    mode?: AssistantMode;
    status?: SuggestionStatus;
    priority?: SuggestionPriority;
    min_confidence?: number;
}
/**
 * Studio AI API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { StudioAIAPI } from '@wave/sdk/studio-ai';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const studioAI = new StudioAIAPI(client);
 *
 * // Start auto-director for a live stream
 * const assistant = await studioAI.startAssistant({
 *   stream_id: 'stream_123',
 *   mode: 'auto_director',
 *   config: {
 *     automation_level: 50,
 *     auto_apply: false,
 *     confidence_threshold: 0.8,
 *   },
 * });
 *
 * // Get scene recommendations
 * const scenes = await studioAI.getSceneRecommendations(assistant.id);
 * ```
 */
