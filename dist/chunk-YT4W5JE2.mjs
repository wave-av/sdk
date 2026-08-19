// src/studio.ts
var StudioAPI = class {
  client;
  basePath = "/v1/productions";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Production CRUD
  // ==========================================================================
  /**
   * Create a new production
   *
   * Requires: productions:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a production by ID
   *
   * Requires: productions:read permission
   */
  async get(productionId) {
    return this.client.get(`${this.basePath}/${productionId}`);
  }
  /**
   * Update a production
   *
   * Requires: productions:update permission
   */
  async update(productionId, request) {
    return this.client.patch(`${this.basePath}/${productionId}`, request);
  }
  /**
   * Remove a production
   *
   * Requires: productions:remove permission (server-side RBAC enforced)
   */
  async remove(productionId) {
    await this.client.delete(`${this.basePath}/${productionId}`);
  }
  /**
   * List productions with optional filters
   *
   * Requires: productions:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  // ==========================================================================
  // Production Lifecycle
  // ==========================================================================
  /**
   * Start a production (go live)
   *
   * Transitions the production from 'idle' or 'rehearsal' to 'live'.
   *
   * Requires: productions:control permission
   */
  async start(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/start`);
  }
  /**
   * Stop a production (end broadcast)
   *
   * Transitions the production to 'ending' and then 'ended'.
   *
   * Requires: productions:control permission
   */
  async stop(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/stop`);
  }
  /**
   * Start a rehearsal session
   *
   * Allows testing sources, scenes, and transitions without going live.
   * Transitions the production from 'idle' to 'rehearsal'.
   *
   * Requires: productions:control permission
   */
  async startRehearsal(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/rehearsal`);
  }
  // ==========================================================================
  // Sources
  // ==========================================================================
  /**
   * Add an input source to a production
   *
   * Requires: productions:sources:create permission
   */
  async addSource(productionId, source) {
    return this.client.post(`${this.basePath}/${productionId}/sources`, source);
  }
  /**
   * Remove a source from a production
   *
   * Requires: productions:sources:remove permission
   */
  async removeSource(productionId, sourceId) {
    await this.client.delete(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }
  /**
   * List all sources for a production
   *
   * Requires: productions:sources:read permission
   */
  async listSources(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/sources`);
  }
  /**
   * Get a specific source by ID
   *
   * Requires: productions:sources:read permission
   */
  async getSource(productionId, sourceId) {
    return this.client.get(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }
  // ==========================================================================
  // Scenes
  // ==========================================================================
  /**
   * Create a new scene in a production
   *
   * Requires: productions:scenes:create permission
   */
  async createScene(productionId, scene) {
    return this.client.post(`${this.basePath}/${productionId}/scenes`, scene);
  }
  /**
   * Update an existing scene
   *
   * Requires: productions:scenes:update permission
   */
  async updateScene(productionId, sceneId, updates) {
    return this.client.patch(`${this.basePath}/${productionId}/scenes/${sceneId}`, updates);
  }
  /**
   * Remove a scene from a production
   *
   * Requires: productions:scenes:remove permission
   */
  async removeScene(productionId, sceneId) {
    await this.client.delete(`${this.basePath}/${productionId}/scenes/${sceneId}`);
  }
  /**
   * List all scenes for a production
   *
   * Requires: productions:scenes:read permission
   */
  async listScenes(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/scenes`);
  }
  /**
   * Activate a scene with an optional transition
   *
   * Sets the scene as the active scene for the production output.
   *
   * Requires: productions:scenes:control permission
   */
  async activateScene(productionId, sceneId, transition) {
    return this.client.post(
      `${this.basePath}/${productionId}/scenes/${sceneId}/activate`,
      transition ? { transition } : void 0
    );
  }
  // ==========================================================================
  // Switching (Program / Preview / Transition)
  // ==========================================================================
  /**
   * Set the program (live) source with an optional transition
   *
   * Switches the currently live output to the specified source.
   *
   * Requires: productions:control permission
   */
  async setProgram(productionId, sourceId, transition) {
    await this.client.post(`${this.basePath}/${productionId}/program`, {
      source_id: sourceId,
      transition
    });
  }
  /**
   * Set the preview source
   *
   * Loads a source into the preview output for inspection before going live.
   *
   * Requires: productions:control permission
   */
  async setPreview(productionId, sourceId) {
    await this.client.post(`${this.basePath}/${productionId}/preview`, { source_id: sourceId });
  }
  /**
   * Execute a transition between preview and program
   *
   * Swaps the current preview source into program using the specified transition.
   *
   * Requires: productions:control permission
   */
  async transition(productionId, config) {
    await this.client.post(`${this.basePath}/${productionId}/transition`, config);
  }
  // ==========================================================================
  // Graphics
  // ==========================================================================
  /**
   * Add a graphic overlay to a production
   *
   * Requires: productions:graphics:create permission
   */
  async addGraphic(productionId, graphic) {
    return this.client.post(`${this.basePath}/${productionId}/graphics`, graphic);
  }
  /**
   * Update an existing graphic
   *
   * Requires: productions:graphics:update permission
   */
  async updateGraphic(productionId, graphicId, updates) {
    return this.client.patch(
      `${this.basePath}/${productionId}/graphics/${graphicId}`,
      updates
    );
  }
  /**
   * Remove a graphic from a production
   *
   * Requires: productions:graphics:remove permission
   */
  async removeGraphic(productionId, graphicId) {
    await this.client.delete(`${this.basePath}/${productionId}/graphics/${graphicId}`);
  }
  /**
   * Show a graphic on the production output
   *
   * Makes the graphic visible on the live output.
   *
   * Requires: productions:graphics:control permission
   */
  async showGraphic(productionId, graphicId) {
    await this.client.post(`${this.basePath}/${productionId}/graphics/${graphicId}/show`);
  }
  /**
   * Hide a graphic from the production output
   *
   * Removes the graphic from the live output without deleting it.
   *
   * Requires: productions:graphics:control permission
   */
  async hideGraphic(productionId, graphicId) {
    await this.client.post(`${this.basePath}/${productionId}/graphics/${graphicId}/hide`);
  }
  // ==========================================================================
  // Audio Mix
  // ==========================================================================
  /**
   * Get the current audio mix for a production
   *
   * Returns volume, mute, solo, pan, and processing settings for all channels.
   *
   * Requires: productions:audio:read permission
   */
  async getAudioMix(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/audio-mix`);
  }
  /**
   * Set the audio mix for a production
   *
   * Updates volume, mute, solo, pan, and processing settings for channels.
   *
   * Requires: productions:audio:control permission
   */
  async setAudioMix(productionId, channels) {
    return this.client.put(`${this.basePath}/${productionId}/audio-mix`, {
      channels
    });
  }
};
function createStudioAPI(client) {
  return new StudioAPI(client);
}

export {
  StudioAPI,
  createStudioAPI
};
