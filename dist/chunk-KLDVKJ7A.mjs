// src/studio-ai.ts
var StudioAIAPI = class {
  client;
  basePath = "/v1/studio-ai";
  constructor(client) {
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
  async startAssistant(request) {
    return this.client.post(`${this.basePath}/assistants`, request);
  }
  /**
   * Get an assistant by ID
   *
   * Requires: studio-ai:read permission
   */
  async getAssistant(assistantId) {
    return this.client.get(`${this.basePath}/assistants/${assistantId}`);
  }
  /**
   * Update an assistant
   *
   * Requires: studio-ai:update permission
   */
  async updateAssistant(assistantId, request) {
    return this.client.patch(
      `${this.basePath}/assistants/${assistantId}`,
      request
    );
  }
  /**
   * Stop an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async stopAssistant(assistantId) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/stop`
    );
  }
  /**
   * Pause an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async pauseAssistant(assistantId) {
    return this.updateAssistant(assistantId, { status: "paused" });
  }
  /**
   * Resume an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async resumeAssistant(assistantId) {
    return this.updateAssistant(assistantId, { status: "active" });
  }
  /**
   * List assistants
   *
   * Requires: studio-ai:read permission
   */
  async listAssistants(params) {
    return this.client.get(
      `${this.basePath}/assistants`,
      { params }
    );
  }
  /**
   * Get assistant statistics
   *
   * Requires: studio-ai:read permission
   */
  async getAssistantStats(assistantId) {
    return this.client.get(
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
  async listSuggestions(params) {
    return this.client.get(
      `${this.basePath}/suggestions`,
      { params }
    );
  }
  /**
   * Get a suggestion by ID
   *
   * Requires: studio-ai:read permission
   */
  async getSuggestion(suggestionId) {
    return this.client.get(
      `${this.basePath}/suggestions/${suggestionId}`
    );
  }
  /**
   * Accept a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async acceptSuggestion(suggestionId) {
    return this.client.post(
      `${this.basePath}/suggestions/${suggestionId}/accept`
    );
  }
  /**
   * Reject a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async rejectSuggestion(suggestionId, reason) {
    return this.client.post(
      `${this.basePath}/suggestions/${suggestionId}/reject`,
      { reason }
    );
  }
  /**
   * Apply a suggestion immediately
   *
   * Requires: studio-ai:apply permission
   */
  async applySuggestion(suggestionId) {
    return this.client.post(
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
  async getSceneRecommendations(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/director/scenes`
    );
  }
  /**
   * Set auto-director rules
   *
   * Requires: studio-ai:update permission
   */
  async setDirectorRules(assistantId, rules) {
    return this.client.post(`${this.basePath}/assistants/${assistantId}/director/rules`, {
      rules
    });
  }
  /**
   * Trigger manual scene switch via AI
   *
   * Requires: studio-ai:apply permission
   */
  async suggestSceneSwitch(assistantId, options) {
    return this.client.post(
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
  async getGraphicsSuggestions(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/graphics/suggestions`
    );
  }
  /**
   * Generate lower third for speaker
   *
   * Requires: studio-ai:apply permission
   */
  async generateLowerThird(assistantId, speakerInfo) {
    return this.client.post(
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
  async getAudioSuggestions(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/audio/suggestions`
    );
  }
  /**
   * Auto-level audio sources
   *
   * Requires: studio-ai:apply permission
   */
  async autoLevelAudio(assistantId) {
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
  async getModerationAlerts(assistantId, params) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts`,
      { params }
    );
  }
  /**
   * Dismiss a moderation alert
   *
   * Requires: studio-ai:apply permission
   */
  async dismissAlert(assistantId, alertId) {
    await this.client.post(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts/${alertId}/dismiss`
    );
  }
  /**
   * Set moderation sensitivity
   *
   * Requires: studio-ai:update permission
   */
  async setModerationSensitivity(assistantId, settings) {
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
  async getEngagementInsights(assistantId, params) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/engagement/insights`,
      { params }
    );
  }
  /**
   * Get optimal interaction times
   *
   * Requires: studio-ai:read permission
   */
  async getOptimalInteractionTimes(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/engagement/optimal-times`
    );
  }
  /**
   * Generate engagement suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async generateEngagementAction(assistantId, type) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/engagement/generate`,
      { type }
    );
  }
};
function createStudioAIAPI(client) {
  return new StudioAIAPI(client);
}

export {
  StudioAIAPI,
  createStudioAIAPI
};
