/**
 * WAVE SDK - Scene AI API
 *
 * AI-powered scene detection, analysis, and segmentation.
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
  CreateSceneDetectionRequest,
  ListSceneDetectionsParams,
  Scene,
  SceneBoundary,
  SceneComparison,
  SceneDetection,
  SceneLabel,
  SceneType,
  Shot,
  ShotType,
} from './scene-types';

export * from './scene-types';

export class SceneAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/scene';

  constructor(client: WaveClient) {
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
  async detect(request: CreateSceneDetectionRequest): Promise<SceneDetection> {
    return this.client.post<SceneDetection>(`${this.basePath}/detect`, request);
  }

  /**
   * Get scene detection job
   *
   * Requires: scene:read permission
   */
  async getDetection(detectionId: string): Promise<SceneDetection> {
    return this.client.get<SceneDetection>(`${this.basePath}/${detectionId}`);
  }

  /**
   * Remove scene detection
   *
   * Requires: scene:remove permission (server-side RBAC enforced)
   */
  async removeDetection(detectionId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${detectionId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * List scene detections
   *
   * Requires: scene:read permission
   */
  async listDetections(
    params?: ListSceneDetectionsParams
  ): Promise<PaginatedResponse<SceneDetection>> {
    return this.client.get<PaginatedResponse<SceneDetection>>(this.basePath, {
      params: params as unknown as Record<string, string | number | boolean | undefined>,
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
  async getScenes(
    detectionId: string,
    params?: PaginationParams & {
      scene_type?: SceneType;
      min_duration?: number;
      min_confidence?: number;
    }
  ): Promise<PaginatedResponse<Scene>> {
    return this.client.get<PaginatedResponse<Scene>>(
      `${this.basePath}/${detectionId}/scenes`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get a specific scene
   *
   * Requires: scene:read permission
   */
  async getScene(detectionId: string, sceneId: string): Promise<Scene> {
    return this.client.get<Scene>(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`
    );
  }

  /**
   * Update scene metadata
   *
   * Requires: scene:update permission
   */
  async updateScene(
    detectionId: string,
    sceneId: string,
    updates: {
      scene_type?: SceneType;
      description?: string;
      labels?: SceneLabel[];
    }
  ): Promise<Scene> {
    return this.client.patch<Scene>(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`,
      updates
    );
  }

  /**
   * Get scene at a specific timestamp
   *
   * Requires: scene:read permission
   */
  async getSceneAtTime(detectionId: string, timestamp: number): Promise<Scene | null> {
    try {
      return await this.client.get<Scene>(
        `${this.basePath}/${detectionId}/scenes/at`,
        { params: { timestamp } as unknown as Record<string, string | number | boolean | undefined> }
      );
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
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
  async getBoundaries(
    detectionId: string,
    params?: PaginationParams & { type?: SceneBoundary['type'] }
  ): Promise<PaginatedResponse<SceneBoundary>> {
    return this.client.get<PaginatedResponse<SceneBoundary>>(
      `${this.basePath}/${detectionId}/boundaries`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Detect scene boundaries only (without full analysis)
   *
   * Requires: scene:detect permission
   */
  async detectBoundaries(
    mediaId: string,
    mediaType: 'video' | 'stream' | 'recording',
    options?: { sensitivity?: number; min_gap?: number }
  ): Promise<SceneBoundary[]> {
    return this.client.post<SceneBoundary[]>(`${this.basePath}/boundaries`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options,
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
  async getShots(
    detectionId: string,
    sceneId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Shot>> {
    return this.client.get<PaginatedResponse<Shot>>(
      `${this.basePath}/${detectionId}/scenes/${sceneId}/shots`,
      { params: params as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get all shots for a detection
   *
   * Requires: scene:read permission
   */
  async getAllShots(
    detectionId: string,
    params?: PaginationParams & { shot_type?: ShotType }
  ): Promise<PaginatedResponse<Shot & { scene_id: string }>> {
    return this.client.get(`${this.basePath}/${detectionId}/shots`, { params: params as unknown as Record<string, string | number | boolean | undefined> });
  }

  // ==========================================================================
  // Analysis
  // ==========================================================================

  /**
   * Get scene summary/statistics
   *
   * Requires: scene:read permission
   */
  async getSummary(
    detectionId: string
  ): Promise<{
    total_scenes: number;
    total_shots: number;
    scene_types: Record<SceneType, number>;
    shot_types: Record<ShotType, number>;
    average_scene_duration: number;
    average_shot_duration: number;
    dominant_colors: string[];
    content_labels: Array<{ label: string; count: number }>;
  }> {
    return this.client.get(`${this.basePath}/${detectionId}/summary`);
  }

  /**
   * Get visual timeline
   *
   * Requires: scene:read permission
   */
  async getTimeline(
    detectionId: string,
    options?: { resolution?: number; include_shots?: boolean }
  ): Promise<
    Array<{
      timestamp: number;
      scene_id: string;
      scene_type: SceneType;
      shot_id?: string;
      shot_type?: ShotType;
      thumbnail_url?: string;
    }>
  > {
    return this.client.get(`${this.basePath}/${detectionId}/timeline`, {
      params: options,
    });
  }

  /**
   * Compare scenes between detections
   *
   * Requires: scene:read permission
   */
  async compareScenes(
    sourceDetectionId: string,
    targetDetectionId: string,
    options?: { min_similarity?: number }
  ): Promise<SceneComparison[]> {
    return this.client.post<SceneComparison[]>(`${this.basePath}/compare`, {
      source_detection_id: sourceDetectionId,
      target_detection_id: targetDetectionId,
      ...options,
    });
  }

  /**
   * Find similar scenes across all content
   *
   * Requires: scene:read permission
   */
  async findSimilarScenes(
    detectionId: string,
    sceneId: string,
    options?: { limit?: number; min_similarity?: number }
  ): Promise<
    Array<{
      detection_id: string;
      scene_id: string;
      media_id: string;
      similarity: number;
      thumbnail_url?: string;
    }>
  > {
    return this.client.get(`${this.basePath}/${detectionId}/scenes/${sceneId}/similar`, {
      params: options,
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
  async exportDetection(
    detectionId: string,
    format: 'json' | 'csv' | 'edl' | 'fcpxml'
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.post(`${this.basePath}/${detectionId}/export`, { format });
  }

  /**
   * Generate scene thumbnails
   *
   * Requires: scene:update permission
   */
  async generateThumbnails(
    detectionId: string,
    options?: { regenerate?: boolean; format?: 'jpg' | 'png'; size?: string }
  ): Promise<{ generated: number }> {
    return this.client.post(`${this.basePath}/${detectionId}/thumbnails`, options);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Wait for scene detection to complete
   */
  async waitForReady(
    detectionId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (detection: SceneDetection) => void;
    }
  ): Promise<SceneDetection> {
    const pollInterval = options?.pollInterval || 3000;
    const timeout = options?.timeout || 1800000; // 30 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const detection = await this.getDetection(detectionId);

      if (options?.onProgress) {
        options.onProgress(detection);
      }

      if (detection.status === 'ready') {
        return detection;
      }

      if (detection.status === 'failed') {
        throw new Error(
          `Scene detection failed: ${detection.error || 'Unknown error'}`
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
  async mergeScenes(
    detectionId: string,
    sceneIds: string[],
    options?: { scene_type?: SceneType; description?: string }
  ): Promise<Scene> {
    return this.client.post<Scene>(
      `${this.basePath}/${detectionId}/scenes/merge`,
      { scene_ids: sceneIds, ...options }
    );
  }

  /**
   * Split scene at timestamp
   *
   * Requires: scene:update permission
   */
  async splitScene(
    detectionId: string,
    sceneId: string,
    splitTime: number
  ): Promise<{ first: Scene; second: Scene }> {
    return this.client.post(`${this.basePath}/${detectionId}/scenes/${sceneId}/split`, {
      split_time: splitTime,
    });
  }
}

/**
 * Create a Scene API instance
 */
export function createSceneAPI(client: WaveClient): SceneAPI {
  return new SceneAPI(client);
}
