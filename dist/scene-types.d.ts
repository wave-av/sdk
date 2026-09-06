import { Metadata, PaginationParams, Timestamps } from './client-types.js';
import './telemetry.js';

/**
 * WAVE SDK - Scene AI API
 *
 * AI-powered scene detection, analysis, and segmentation.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Scene detection status
 */
type SceneDetectionStatus = 'pending' | 'processing' | 'ready' | 'failed';
/**
 * Scene type
 */
type SceneType = 'intro' | 'outro' | 'transition' | 'main_content' | 'interview' | 'b_roll' | 'action' | 'dialogue' | 'montage' | 'credits' | 'advertisement' | 'unknown';
/**
 * Shot type
 */
type ShotType = 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'establishing' | 'over_shoulder' | 'pov' | 'aerial' | 'tracking' | 'static';
/**
 * Scene detection job
 */
interface SceneDetection extends Timestamps {
    id: string;
    organization_id: string;
    media_id: string;
    media_type: 'video' | 'stream' | 'recording';
    status: SceneDetectionStatus;
    scene_count?: number;
    shot_count?: number;
    total_duration?: number;
    processing_time?: number;
    error?: string;
    metadata?: Metadata;
}
/**
 * Detected scene
 */
interface Scene extends Timestamps {
    id: string;
    detection_id: string;
    start_time: number;
    end_time: number;
    duration: number;
    scene_type: SceneType;
    confidence: number;
    thumbnail_url?: string;
    description?: string;
    shots: Shot[];
    labels: SceneLabel[];
    visual_features: VisualFeatures;
    audio_features?: AudioFeatures;
    order: number;
}
/**
 * Shot within a scene
 */
interface Shot {
    id: string;
    start_time: number;
    end_time: number;
    duration: number;
    shot_type: ShotType;
    confidence: number;
    thumbnail_url?: string;
    motion_intensity: number;
    dominant_colors: string[];
}
/**
 * Scene label
 */
interface SceneLabel {
    label: string;
    confidence: number;
    category: string;
}
/**
 * Visual features
 */
interface VisualFeatures {
    dominant_colors: string[];
    brightness: number;
    contrast: number;
    saturation: number;
    motion_intensity: number;
    faces_detected: number;
    text_detected: boolean;
    objects: string[];
}
/**
 * Audio features
 */
interface AudioFeatures {
    has_speech: boolean;
    has_music: boolean;
    loudness: number;
    silence_ratio: number;
    speech_ratio: number;
    music_ratio: number;
}
/**
 * Scene boundary
 */
interface SceneBoundary {
    timestamp: number;
    type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'other';
    confidence: number;
    before_thumbnail?: string;
    after_thumbnail?: string;
}
/**
 * Create scene detection request
 */
interface CreateSceneDetectionRequest {
    media_id: string;
    media_type: 'video' | 'stream' | 'recording';
    options?: {
        /** Minimum scene duration in seconds */
        min_scene_duration?: number;
        /** Detection sensitivity (0-1) */
        sensitivity?: number;
        /** Enable shot detection */
        detect_shots?: boolean;
        /** Enable scene classification */
        classify_scenes?: boolean;
        /** Enable audio analysis */
        analyze_audio?: boolean;
        /** Generate thumbnails */
        generate_thumbnails?: boolean;
        /** Extract visual features */
        extract_features?: boolean;
    };
    /** Webhook URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
/**
 * List scene detections params
 */
interface ListSceneDetectionsParams extends PaginationParams {
    media_id?: string;
    status?: SceneDetectionStatus;
    created_after?: string;
    created_before?: string;
}
/**
 * Scene comparison result
 */
interface SceneComparison {
    source_scene_id: string;
    target_scene_id: string;
    similarity_score: number;
    visual_similarity: number;
    audio_similarity?: number;
    duration_difference: number;
    matched_labels: string[];
}

export type { AudioFeatures, CreateSceneDetectionRequest, ListSceneDetectionsParams, Scene, SceneBoundary, SceneComparison, SceneDetection, SceneDetectionStatus, SceneLabel, SceneType, Shot, ShotType, VisualFeatures };
