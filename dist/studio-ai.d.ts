/**
 * WAVE SDK - Studio AI API
 *
 * AI-powered production assistance for live streaming and video production.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import type { AIAssistant, AISuggestion, AssistantMode, AssistantStats, AudioMixSuggestion, EngagementInsight, GraphicsSuggestion, ListSuggestionsParams, ModerationAlert, SceneRecommendation, StartAssistantRequest, UpdateAssistantRequest } from './studio-ai-types';
export * from './studio-ai-types';
export declare class StudioAIAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Start an AI assistant
     *
     * Requires: studio-ai:create permission
     */
    startAssistant(request: StartAssistantRequest): Promise<AIAssistant>;
    /**
     * Get an assistant by ID
     *
     * Requires: studio-ai:read permission
     */
    getAssistant(assistantId: string): Promise<AIAssistant>;
    /**
     * Update an assistant
     *
     * Requires: studio-ai:update permission
     */
    updateAssistant(assistantId: string, request: UpdateAssistantRequest): Promise<AIAssistant>;
    /**
     * Stop an assistant
     *
     * Requires: studio-ai:manage permission
     */
    stopAssistant(assistantId: string): Promise<AIAssistant>;
    /**
     * Pause an assistant
     *
     * Requires: studio-ai:manage permission
     */
    pauseAssistant(assistantId: string): Promise<AIAssistant>;
    /**
     * Resume an assistant
     *
     * Requires: studio-ai:manage permission
     */
    resumeAssistant(assistantId: string): Promise<AIAssistant>;
    /**
     * List assistants
     *
     * Requires: studio-ai:read permission
     */
    listAssistants(params?: PaginationParams & {
        stream_id?: string;
        mode?: AssistantMode;
        status?: 'active' | 'paused' | 'stopped';
    }): Promise<PaginatedResponse<AIAssistant>>;
    /**
     * Get assistant statistics
     *
     * Requires: studio-ai:read permission
     */
    getAssistantStats(assistantId: string): Promise<AssistantStats>;
    /**
     * List suggestions
     *
     * Requires: studio-ai:read permission
     */
    listSuggestions(params?: ListSuggestionsParams): Promise<PaginatedResponse<AISuggestion>>;
    /**
     * Get a suggestion by ID
     *
     * Requires: studio-ai:read permission
     */
    getSuggestion(suggestionId: string): Promise<AISuggestion>;
    /**
     * Accept a suggestion
     *
     * Requires: studio-ai:apply permission
     */
    acceptSuggestion(suggestionId: string): Promise<AISuggestion>;
    /**
     * Reject a suggestion
     *
     * Requires: studio-ai:apply permission
     */
    rejectSuggestion(suggestionId: string, reason?: string): Promise<AISuggestion>;
    /**
     * Apply a suggestion immediately
     *
     * Requires: studio-ai:apply permission
     */
    applySuggestion(suggestionId: string): Promise<AISuggestion>;
    /**
     * Get scene recommendations
     *
     * Requires: studio-ai:read permission
     */
    getSceneRecommendations(assistantId: string): Promise<SceneRecommendation[]>;
    /**
     * Set auto-director rules
     *
     * Requires: studio-ai:update permission
     */
    setDirectorRules(assistantId: string, rules: Array<{
        trigger: string;
        condition: Record<string, unknown>;
        action: {
            scene_id: string;
            duration?: number;
        };
        priority: number;
    }>): Promise<{
        rules_count: number;
    }>;
    /**
     * Trigger manual scene switch via AI
     *
     * Requires: studio-ai:apply permission
     */
    suggestSceneSwitch(assistantId: string, options?: {
        reason?: string;
    }): Promise<SceneRecommendation>;
    /**
     * Get graphics suggestions
     *
     * Requires: studio-ai:read permission
     */
    getGraphicsSuggestions(assistantId: string): Promise<GraphicsSuggestion[]>;
    /**
     * Generate lower third for speaker
     *
     * Requires: studio-ai:apply permission
     */
    generateLowerThird(assistantId: string, speakerInfo?: {
        name?: string;
        title?: string;
    }): Promise<GraphicsSuggestion>;
    /**
     * Get audio mix suggestions
     *
     * Requires: studio-ai:read permission
     */
    getAudioSuggestions(assistantId: string): Promise<AudioMixSuggestion[]>;
    /**
     * Auto-level audio sources
     *
     * Requires: studio-ai:apply permission
     */
    autoLevelAudio(assistantId: string): Promise<{
        adjustments: AudioMixSuggestion[];
    }>;
    /**
     * Get moderation alerts
     *
     * Requires: studio-ai:read permission
     */
    getModerationAlerts(assistantId: string, params?: PaginationParams & {
        severity?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<PaginatedResponse<ModerationAlert>>;
    /**
     * Dismiss a moderation alert
     *
     * Requires: studio-ai:apply permission
     */
    dismissAlert(assistantId: string, alertId: string): Promise<void>;
    /**
     * Set moderation sensitivity
     *
     * Requires: studio-ai:update permission
     */
    setModerationSensitivity(assistantId: string, settings: {
        inappropriate_content?: number;
        copyright?: number;
        spam?: number;
        hate_speech?: number;
        violence?: number;
    }): Promise<{
        updated: boolean;
    }>;
    /**
     * Get engagement insights
     *
     * Requires: studio-ai:read permission
     */
    getEngagementInsights(assistantId: string, params?: {
        since?: string;
        type?: EngagementInsight['type'];
    }): Promise<EngagementInsight[]>;
    /**
     * Get optimal interaction times
     *
     * Requires: studio-ai:read permission
     */
    getOptimalInteractionTimes(assistantId: string): Promise<Array<{
        time: number;
        reason: string;
        engagement_score: number;
    }>>;
    /**
     * Generate engagement suggestion
     *
     * Requires: studio-ai:apply permission
     */
    generateEngagementAction(assistantId: string, type: 'poll' | 'question' | 'shoutout' | 'giveaway'): Promise<{
        type: string;
        content: Record<string, unknown>;
        timing: string;
    }>;
}
/**
 * Create a Studio AI API instance
 */
export declare function createStudioAIAPI(client: WaveClient): StudioAIAPI;
