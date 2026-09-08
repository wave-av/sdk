// src/ghost.ts
var GhostAPI = class {
  client;
  basePath = "/v1/productions";
  constructor(client) {
    this.client = client;
  }
  /**
   * Start an Autopilot directing session
   *
   * Requires: ghost:create permission
   */
  async start(request) {
    return this.client.post(
      `${this.basePath}/${request.production_id}/ghost`,
      request
    );
  }
  /**
   * Get the current Autopilot session for a production
   *
   * Requires: ghost:read permission
   */
  async get(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost`);
  }
  /**
   * Update an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async update(productionId, request) {
    return this.client.patch(`${this.basePath}/${productionId}/ghost`, request);
  }
  /**
   * Stop an Autopilot session
   *
   * Requires: ghost:stop permission
   */
  async stop(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/stop`);
  }
  /**
   * Pause an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async pause(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/pause`);
  }
  /**
   * Resume a paused Autopilot session
   *
   * Requires: ghost:update permission
   */
  async resume(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/resume`);
  }
  /**
   * Override the current shot with a manual selection
   *
   * Requires: ghost:override permission
   */
  async override(productionId, override) {
    await this.client.post(`${this.basePath}/${productionId}/ghost/override`, override);
  }
  /**
   * List AI suggestions for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async listSuggestions(productionId, params) {
    return this.client.get(
      `${this.basePath}/${productionId}/ghost/suggestions`,
      { params }
    );
  }
  /**
   * Accept an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async acceptSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/accept`
    );
  }
  /**
   * Reject an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async rejectSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/reject`
    );
  }
  /**
   * Get directing statistics for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async getStats(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost/stats`);
  }
};
function createGhostAPI(client) {
  return new GhostAPI(client);
}

export {
  GhostAPI,
  createGhostAPI
};
