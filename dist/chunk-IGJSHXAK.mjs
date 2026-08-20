// src/scene.ts
var SceneAPI = class {
  client;
  basePath = "/v1/scene";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Scene Detection
  // ==========================================================================
  /**
   * Start scene detection
   *
   * Requires: scene:detect permission
   */
  async detect(request) {
    return this.client.post(`${this.basePath}/detect`, request);
  }
  /**
   * Get scene detection job
   *
   * Requires: scene:read permission
   */
  async getDetection(detectionId) {
    return this.client.get(`${this.basePath}/${detectionId}`);
  }
  /**
   * Remove scene detection
   *
   * Requires: scene:remove permission (server-side RBAC enforced)
   */
  async removeDetection(detectionId) {
    await this.client.delete(
      `${this.basePath}/${detectionId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List scene detections
   *
   * Requires: scene:read permission
   */
  async listDetections(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  // ==========================================================================
  // Scenes
  // ==========================================================================
  /**
   * Get scenes for a detection
   *
   * Requires: scene:read permission
   */
  async getScenes(detectionId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes`,
      { params }
    );
  }
  /**
   * Get a specific scene
   *
   * Requires: scene:read permission
   */
  async getScene(detectionId, sceneId) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`
    );
  }
  /**
   * Update scene metadata
   *
   * Requires: scene:update permission
   */
  async updateScene(detectionId, sceneId, updates) {
    return this.client.patch(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`,
      updates
    );
  }
  /**
   * Get scene at a specific timestamp
   *
   * Requires: scene:read permission
   */
  async getSceneAtTime(detectionId, timestamp) {
    try {
      return await this.client.get(
        `${this.basePath}/${detectionId}/scenes/at`,
        { params: { timestamp } }
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  // ==========================================================================
  // Scene Boundaries
  // ==========================================================================
  /**
   * Get scene boundaries (transitions)
   *
   * Requires: scene:read permission
   */
  async getBoundaries(detectionId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/boundaries`,
      { params }
    );
  }
  /**
   * Detect scene boundaries only (without full analysis)
   *
   * Requires: scene:detect permission
   */
  async detectBoundaries(mediaId, mediaType, options) {
    return this.client.post(`${this.basePath}/boundaries`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options
    });
  }
  // ==========================================================================
  // Shots
  // ==========================================================================
  /**
   * Get shots for a scene
   *
   * Requires: scene:read permission
   */
  async getShots(detectionId, sceneId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes/${sceneId}/shots`,
      { params }
    );
  }
  /**
   * Get all shots for a detection
   *
   * Requires: scene:read permission
   */
  async getAllShots(detectionId, params) {
    return this.client.get(`${this.basePath}/${detectionId}/shots`, { params });
  }
  // ==========================================================================
  // Analysis
  // ==========================================================================
  /**
   * Get scene summary/statistics
   *
   * Requires: scene:read permission
   */
  async getSummary(detectionId) {
    return this.client.get(`${this.basePath}/${detectionId}/summary`);
  }
  /**
   * Get visual timeline
   *
   * Requires: scene:read permission
   */
  async getTimeline(detectionId, options) {
    return this.client.get(`${this.basePath}/${detectionId}/timeline`, {
      params: options
    });
  }
  /**
   * Compare scenes between detections
   *
   * Requires: scene:read permission
   */
  async compareScenes(sourceDetectionId, targetDetectionId, options) {
    return this.client.post(`${this.basePath}/compare`, {
      source_detection_id: sourceDetectionId,
      target_detection_id: targetDetectionId,
      ...options
    });
  }
  /**
   * Find similar scenes across all content
   *
   * Requires: scene:read permission
   */
  async findSimilarScenes(detectionId, sceneId, options) {
    return this.client.get(`${this.basePath}/${detectionId}/scenes/${sceneId}/similar`, {
      params: options
    });
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export scene data
   *
   * Requires: scene:read permission
   */
  async exportDetection(detectionId, format) {
    return this.client.post(`${this.basePath}/${detectionId}/export`, { format });
  }
  /**
   * Generate scene thumbnails
   *
   * Requires: scene:update permission
   */
  async generateThumbnails(detectionId, options) {
    return this.client.post(`${this.basePath}/${detectionId}/thumbnails`, options);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for scene detection to complete
   */
  async waitForReady(detectionId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const detection = await this.getDetection(detectionId);
      if (options?.onProgress) {
        options.onProgress(detection);
      }
      if (detection.status === "ready") {
        return detection;
      }
      if (detection.status === "failed") {
        throw new Error(
          `Scene detection failed: ${detection.error || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Scene detection timed out after ${timeout}ms`);
  }
  /**
   * Merge scenes
   *
   * Requires: scene:update permission
   */
  async mergeScenes(detectionId, sceneIds, options) {
    return this.client.post(
      `${this.basePath}/${detectionId}/scenes/merge`,
      { scene_ids: sceneIds, ...options }
    );
  }
  /**
   * Split scene at timestamp
   *
   * Requires: scene:update permission
   */
  async splitScene(detectionId, sceneId, splitTime) {
    return this.client.post(`${this.basePath}/${detectionId}/scenes/${sceneId}/split`, {
      split_time: splitTime
    });
  }
};
function createSceneAPI(client) {
  return new SceneAPI(client);
}

export {
  SceneAPI,
  createSceneAPI
};
