/**
 * WAVE SDK - Scene AI API
 *
 * AI-powered scene detection, analysis, and segmentation.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import type { CreateSceneDetectionRequest, ListSceneDetectionsParams, Scene, SceneBoundary, SceneComparison, SceneDetection, SceneLabel, SceneType, Shot, ShotType } from './scene-types';
export * from './scene-types';
export declare class SceneAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Start scene detection
     *
     * Requires: scene:detect permission
     */
    detect(request: CreateSceneDetectionRequest): Promise<SceneDetection>;
    /**
     * Get scene detection job
     *
     * Requires: scene:read permission
     */
    getDetection(detectionId: string): Promise<SceneDetection>;
    /**
     * Remove scene detection
     *
     * Requires: scene:remove permission (server-side RBAC enforced)
     */
    removeDetection(detectionId: string): Promise<void>;
    /**
     * List scene detections
     *
     * Requires: scene:read permission
     */
    listDetections(params?: ListSceneDetectionsParams): Promise<PaginatedResponse<SceneDetection>>;
    /**
     * Get scenes for a detection
     *
     * Requires: scene:read permission
     */
    getScenes(detectionId: string, params?: PaginationParams & {
        scene_type?: SceneType;
        min_duration?: number;
        min_confidence?: number;
    }): Promise<PaginatedResponse<Scene>>;
    /**
     * Get a specific scene
     *
     * Requires: scene:read permission
     */
    getScene(detectionId: string, sceneId: string): Promise<Scene>;
    /**
     * Update scene metadata
     *
     * Requires: scene:update permission
     */
    updateScene(detectionId: string, sceneId: string, updates: {
        scene_type?: SceneType;
        description?: string;
        labels?: SceneLabel[];
    }): Promise<Scene>;
    /**
     * Get scene at a specific timestamp
     *
     * Requires: scene:read permission
     */
    getSceneAtTime(detectionId: string, timestamp: number): Promise<Scene | null>;
    /**
     * Get scene boundaries (transitions)
     *
     * Requires: scene:read permission
     */
    getBoundaries(detectionId: string, params?: PaginationParams & {
        type?: SceneBoundary['type'];
    }): Promise<PaginatedResponse<SceneBoundary>>;
    /**
     * Detect scene boundaries only (without full analysis)
     *
     * Requires: scene:detect permission
     */
    detectBoundaries(mediaId: string, mediaType: 'video' | 'stream' | 'recording', options?: {
        sensitivity?: number;
        min_gap?: number;
    }): Promise<SceneBoundary[]>;
    /**
     * Get shots for a scene
     *
     * Requires: scene:read permission
     */
    getShots(detectionId: string, sceneId: string, params?: PaginationParams): Promise<PaginatedResponse<Shot>>;
    /**
     * Get all shots for a detection
     *
     * Requires: scene:read permission
     */
    getAllShots(detectionId: string, params?: PaginationParams & {
        shot_type?: ShotType;
    }): Promise<PaginatedResponse<Shot & {
        scene_id: string;
    }>>;
    /**
     * Get scene summary/statistics
     *
     * Requires: scene:read permission
     */
    getSummary(detectionId: string): Promise<{
        total_scenes: number;
        total_shots: number;
        scene_types: Record<SceneType, number>;
        shot_types: Record<ShotType, number>;
        average_scene_duration: number;
        average_shot_duration: number;
        dominant_colors: string[];
        content_labels: Array<{
            label: string;
            count: number;
        }>;
    }>;
    /**
     * Get visual timeline
     *
     * Requires: scene:read permission
     */
    getTimeline(detectionId: string, options?: {
        resolution?: number;
        include_shots?: boolean;
    }): Promise<Array<{
        timestamp: number;
        scene_id: string;
        scene_type: SceneType;
        shot_id?: string;
        shot_type?: ShotType;
        thumbnail_url?: string;
    }>>;
    /**
     * Compare scenes between detections
     *
     * Requires: scene:read permission
     */
    compareScenes(sourceDetectionId: string, targetDetectionId: string, options?: {
        min_similarity?: number;
    }): Promise<SceneComparison[]>;
    /**
     * Find similar scenes across all content
     *
     * Requires: scene:read permission
     */
    findSimilarScenes(detectionId: string, sceneId: string, options?: {
        limit?: number;
        min_similarity?: number;
    }): Promise<Array<{
        detection_id: string;
        scene_id: string;
        media_id: string;
        similarity: number;
        thumbnail_url?: string;
    }>>;
    /**
     * Export scene data
     *
     * Requires: scene:read permission
     */
    exportDetection(detectionId: string, format: 'json' | 'csv' | 'edl' | 'fcpxml'): Promise<{
        url: string;
        expires_at: string;
    }>;
    /**
     * Generate scene thumbnails
     *
     * Requires: scene:update permission
     */
    generateThumbnails(detectionId: string, options?: {
        regenerate?: boolean;
        format?: 'jpg' | 'png';
        size?: string;
    }): Promise<{
        generated: number;
    }>;
    /**
     * Wait for scene detection to complete
     */
    waitForReady(detectionId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (detection: SceneDetection) => void;
    }): Promise<SceneDetection>;
    /**
     * Merge scenes
     *
     * Requires: scene:update permission
     */
    mergeScenes(detectionId: string, sceneIds: string[], options?: {
        scene_type?: SceneType;
        description?: string;
    }): Promise<Scene>;
    /**
     * Split scene at timestamp
     *
     * Requires: scene:update permission
     */
    splitScene(detectionId: string, sceneId: string, splitTime: number): Promise<{
        first: Scene;
        second: Scene;
    }>;
}
/**
 * Create a Scene API instance
 */
export declare function createSceneAPI(client: WaveClient): SceneAPI;
