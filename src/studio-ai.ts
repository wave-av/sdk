/**
 * WAVE SDK - Studio AI API
 *
 * AI-powered production assistance for live streaming and video production.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
} from './client';

import type {
  AIAssistant,
  AISuggestion,
  AssistantMode,
  AssistantStats,
  AudioMixSuggestion,
  EngagementInsight,
  GraphicsSuggestion,
  ListSuggestionsParams,
  ModerationAlert,
  SceneRecommendation,
  StartAssistantRequest,
  UpdateAssistantRequest,
} from './studio-ai-types';

export * from './studio-ai-types';

export class StudioAIAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/studio-ai';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // AI Assistants
  // ==========================================================================

  /**
   * Start an AI assistant
   *
   * Requires: studio-ai:create permission
   */
  async startAssistant(request: StartAssistantRequest): Promise<AIAssistant> {
    return this.client.post<AIAssistant>(`${this.basePath}/assistants`, request);
  }

  /**
   * Get an assistant by ID
   *
   * Requires: studio-ai:read permission
   */
  async getAssistant(assistantId: string): Promise<AIAssistant> {
    return this.client.get<AIAssistant>(`${this.basePath}/assistants/${assistantId}`);
  }

  /**
   * Update an assistant
   *
   * Requires: studio-ai:update permission
   */
  async updateAssistant(
    assistantId: string,
    request: UpdateAssistantRequest
  ): Promise<AIAssistant> {
    return this.client.patch<AIAssistant>(
      `${this.basePath}/assistants/${assistantId}`,
      request
    );
  }

  /**
   * Stop an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async stopAssistant(assistantId: string): Promise<AIAssistant> {
    return this.client.post<AIAssistant>(
      `${this.basePath}/assistants/${assistantId}/stop`
    );
  }

  /**
   * Pause an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async pauseAssistant(assistantId: string): Promise<AIAssistant> {
    return this.updateAssistant(assistantId, { status: 'paused' });
  }

  /**
   * Resume an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async resumeAssistant(assistantId: string): Promise<AIAssistant> {
    return this.updateAssistant(assistantId, { status: 'active' });
  }

  /**
   * List assistants
   *
   * Requires: studio-ai:read permission
   */
  async listAssistants(
    params?: PaginationParams & {
      stream_id?: string;
      mode?: AssistantMode;
      status?: 'active' | 'paused' | 'stopped';
    }
  ): Promise<PaginatedResponse<AIAssistant>> {
    return this.client.get<PaginatedResponse<AIAssistant>>(
      `${this.basePath}/assistants`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get assistant statistics
   *
   * Requires: studio-ai:read permission
   */
  async getAssistantStats(assistantId: string): Promise<AssistantStats> {
    return this.client.get<AssistantStats>(
      `${this.basePath}/assistants/${assistantId}/stats`
    );
  }

  // ==========================================================================
  // Suggestions
  // ==========================================================================

  /**
   * List suggestions
   *
   * Requires: studio-ai:read permission
   */
  async listSuggestions(
    params?: ListSuggestionsParams
  ): Promise<PaginatedResponse<AISuggestion>> {
    return this.client.get<PaginatedResponse<AISuggestion>>(
      `${this.basePath}/suggestions`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get a suggestion by ID
   *
   * Requires: studio-ai:read permission
   */
  async getSuggestion(suggestionId: string): Promise<AISuggestion> {
    return this.client.get<AISuggestion>(
      `${this.basePath}/suggestions/${suggestionId}`
    );
  }

  /**
   * Accept a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async acceptSuggestion(suggestionId: string): Promise<AISuggestion> {
    return this.client.post<AISuggestion>(
      `${this.basePath}/suggestions/${suggestionId}/accept`
    );
  }

  /**
   * Reject a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async rejectSuggestion(
    suggestionId: string,
    reason?: string
  ): Promise<AISuggestion> {
    return this.client.post<AISuggestion>(
      `${this.basePath}/suggestions/${suggestionId}/reject`,
      { reason }
    );
  }

  /**
   * Apply a suggestion immediately
   *
   * Requires: studio-ai:apply permission
   */
  async applySuggestion(suggestionId: string): Promise<AISuggestion> {
    return this.client.post<AISuggestion>(
      `${this.basePath}/suggestions/${suggestionId}/apply`
    );
  }

  // ==========================================================================
  // Auto-Director
  // ==========================================================================

  /**
   * Get scene recommendations
   *
   * Requires: studio-ai:read permission
   */
  async getSceneRecommendations(
    assistantId: string
  ): Promise<SceneRecommendation[]> {
    return this.client.get<SceneRecommendation[]>(
      `${this.basePath}/assistants/${assistantId}/director/scenes`
    );
  }

  /**
   * Set auto-director rules
   *
   * Requires: studio-ai:update permission
   */
  async setDirectorRules(
    assistantId: string,
    rules: Array<{
      trigger: string;
      condition: Record<string, unknown>;
      action: { scene_id: string; duration?: number };
      priority: number;
    }>
  ): Promise<{ rules_count: number }> {
    return this.client.post(`${this.basePath}/assistants/${assistantId}/director/rules`, {
      rules,
    });
  }

  /**
   * Trigger manual scene switch via AI
   *
   * Requires: studio-ai:apply permission
   */
  async suggestSceneSwitch(
    assistantId: string,
    options?: { reason?: string }
  ): Promise<SceneRecommendation> {
    return this.client.post<SceneRecommendation>(
      `${this.basePath}/assistants/${assistantId}/director/suggest`,
      options
    );
  }

  // ==========================================================================
  // Graphics Operator
  // ==========================================================================

  /**
   * Get graphics suggestions
   *
   * Requires: studio-ai:read permission
   */
  async getGraphicsSuggestions(assistantId: string): Promise<GraphicsSuggestion[]> {
    return this.client.get<GraphicsSuggestion[]>(
      `${this.basePath}/assistants/${assistantId}/graphics/suggestions`
    );
  }

  /**
   * Generate lower third for speaker
   *
   * Requires: studio-ai:apply permission
   */
  async generateLowerThird(
    assistantId: string,
    speakerInfo?: { name?: string; title?: string }
  ): Promise<GraphicsSuggestion> {
    return this.client.post<GraphicsSuggestion>(
      `${this.basePath}/assistants/${assistantId}/graphics/lower-third`,
      speakerInfo
    );
  }

  // ==========================================================================
  // Audio Mixer
  // ==========================================================================

  /**
   * Get audio mix suggestions
   *
   * Requires: studio-ai:read permission
   */
  async getAudioSuggestions(assistantId: string): Promise<AudioMixSuggestion[]> {
    return this.client.get<AudioMixSuggestion[]>(
      `${this.basePath}/assistants/${assistantId}/audio/suggestions`
    );
  }

  /**
   * Auto-level audio sources
   *
   * Requires: studio-ai:apply permission
   */
  async autoLevelAudio(
    assistantId: string
  ): Promise<{ adjustments: AudioMixSuggestion[] }> {
    return this.client.post(`${this.basePath}/assistants/${assistantId}/audio/auto-level`);
  }

  // ==========================================================================
  // Content Moderation
  // ==========================================================================

  /**
   * Get moderation alerts
   *
   * Requires: studio-ai:read permission
   */
  async getModerationAlerts(
    assistantId: string,
    params?: PaginationParams & { severity?: 'low' | 'medium' | 'high' | 'critical' }
  ): Promise<PaginatedResponse<ModerationAlert>> {
    return this.client.get<PaginatedResponse<ModerationAlert>>(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Dismiss a moderation alert
   *
   * Requires: studio-ai:apply permission
   */
  async dismissAlert(assistantId: string, alertId: string): Promise<void> {
    await this.client.post(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts/${alertId}/dismiss`
    );
  }

  /**
   * Set moderation sensitivity
   *
   * Requires: studio-ai:update permission
   */
  async setModerationSensitivity(
    assistantId: string,
    settings: {
      inappropriate_content?: number;
      copyright?: number;
      spam?: number;
      hate_speech?: number;
      violence?: number;
    }
  ): Promise<{ updated: boolean }> {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/moderation/sensitivity`,
      settings
    );
  }

  // ==========================================================================
  // Engagement Manager
  // ==========================================================================

  /**
   * Get engagement insights
   *
   * Requires: studio-ai:read permission
   */
  async getEngagementInsights(
    assistantId: string,
    params?: { since?: string; type?: EngagementInsight['type'] }
  ): Promise<EngagementInsight[]> {
    return this.client.get<EngagementInsight[]>(
      `${this.basePath}/assistants/${assistantId}/engagement/insights`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get optimal interaction times
   *
   * Requires: studio-ai:read permission
   */
  async getOptimalInteractionTimes(
    assistantId: string
  ): Promise<Array<{ time: number; reason: string; engagement_score: number }>> {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/engagement/optimal-times`
    );
  }

  /**
   * Generate engagement suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async generateEngagementAction(
    assistantId: string,
    type: 'poll' | 'question' | 'shoutout' | 'giveaway'
  ): Promise<{
    type: string;
    content: Record<string, unknown>;
    timing: string;
  }> {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/engagement/generate`,
      { type }
    );
  }
}

/**
 * Create a Studio AI API instance
 */
export function createStudioAIAPI(client: WaveClient): StudioAIAPI {
  return new StudioAIAPI(client);
}
