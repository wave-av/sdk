/**
 * WAVE SDK - Studio API
 *
 * Multi-camera broadcast production system for creating, managing, and
 * controlling live productions with sources, scenes, graphics, and audio mixing.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { PaginationParams, Timestamps, Metadata } from "./client";
/**
 * Production lifecycle status
 */
export type ProductionStatus = "idle" | "rehearsal" | "live" | "ending" | "ended";
/**
 * Input source type for a production
 */
export type SourceType = "camera" | "ndi" | "screen_share" | "rtmp_input" | "srt_input" | "media_file" | "browser" | "color_bars";
/**
 * Video transition type between sources or scenes
 */
export type TransitionType = "cut" | "dissolve" | "wipe" | "fade" | "stinger";
/**
 * Scene layout preset
 */
export type LayoutType = "fullscreen" | "split_2" | "split_3" | "split_4" | "pip" | "side_by_side" | "grid_2x2" | "grid_3x3" | "custom";
/**
 * Transition configuration for scene or source changes
 */
export interface TransitionConfig {
    /** Transition effect type */
    type: TransitionType;
    /** Duration in milliseconds */
    duration_ms: number;
    /** Direction for directional transitions (e.g., wipe) */
    direction?: "left" | "right" | "up" | "down";
}
/**
 * Position and crop settings for a source within a scene
 */
export interface SceneSource {
    /** Reference to the source */
    source_id: string;
    /** Position and dimensions within the scene canvas */
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
        z_index: number;
    };
    /** Crop region (normalized 0-1 values) */
    crop?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    /** Whether audio from this source is enabled */
    audio_enabled?: boolean;
    /** Audio volume (0-1) */
    volume?: number;
}
/**
 * Production scene with layout and source arrangement
 */
export interface Scene extends Timestamps {
    id: string;
    production_id: string;
    name: string;
    /** Layout preset for this scene */
    layout: LayoutType;
    /** Sources arranged within this scene */
    sources: SceneSource[];
    /** Transition to use when activating this scene */
    transition_in?: TransitionConfig;
    /** Whether this scene is currently active */
    is_active: boolean;
    /** Display order */
    sort_order: number;
}
/**
 * Input source connected to a production
 */
export interface Source extends Timestamps {
    id: string;
    production_id: string;
    name: string;
    /** Input source type */
    type: SourceType;
    /** Source URL or connection string */
    url?: string;
    /** Connection status */
    status: "connected" | "disconnected" | "error";
    /** Tally indicator (program = live, preview = next, off = inactive) */
    tally: "program" | "preview" | "off";
    /** Current audio level in dBFS */
    audio_level?: number;
    /** Audio volume (0-1) */
    volume?: number;
    /** Whether the source audio is muted */
    muted?: boolean;
    /** Whether PTZ (pan-tilt-zoom) control is enabled */
    ptz_enabled?: boolean;
    /** Position information for PTZ cameras */
    position?: {
        pan: number;
        tilt: number;
        zoom: number;
    };
}
/**
 * Live production session
 */
export interface Production extends Timestamps {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    /** Current production lifecycle status */
    status: ProductionStatus;
    /** Source currently on program (live) output */
    program_source_id?: string;
    /** Source currently on preview output */
    preview_source_id?: string;
    /** Currently active scene */
    active_scene_id?: string;
    /** Whether recording is enabled */
    recording_enabled: boolean;
    /** Whether live streaming output is enabled */
    streaming_enabled: boolean;
    /** Current number of viewers */
    viewer_count: number;
    /** When the production went live */
    started_at?: string;
    /** When the production ended */
    ended_at?: string;
    /** Tags for organization and search */
    tags?: string[];
    /** Custom metadata */
    metadata?: Metadata;
}
/**
 * Graphic overlay element
 */
export interface Graphic extends Timestamps {
    id: string;
    production_id: string;
    name: string;
    /** Graphic overlay type */
    type: "lower_third" | "full_screen" | "logo" | "ticker" | "scoreboard" | "custom";
    /** Graphic content (template data, text, image URL, etc.) */
    content: Record<string, unknown>;
    /** Position on the canvas */
    position?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** Whether the graphic is currently visible on output */
    visible: boolean;
    /** Render layer (higher = on top) */
    layer: number;
}
/**
 * Audio mix channel for a source
 */
export interface AudioMixChannel {
    /** Source this channel controls */
    source_id: string;
    /** Volume level (0-1) */
    volume: number;
    /** Whether the channel is muted */
    muted: boolean;
    /** Whether the channel is soloed */
    solo: boolean;
    /** Stereo pan (-1 left to 1 right) */
    pan: number;
    /** Whether EQ is enabled */
    eq_enabled: boolean;
    /** Whether the compressor is enabled */
    compressor_enabled: boolean;
}
/**
 * Create production request
 */
export interface CreateProductionRequest {
    title: string;
    description?: string;
    /** Enable recording when going live */
    recording_enabled?: boolean;
    /** Enable live streaming output */
    streaming_enabled?: boolean;
    /** Default layout for new scenes */
    default_layout?: LayoutType;
    /** Tags for organization and search */
    tags?: string[];
    /** Custom metadata */
    metadata?: Metadata;
}
/**
 * Update production request
 */
export interface UpdateProductionRequest {
    title?: string;
    description?: string;
    /** Enable or disable recording */
    recording_enabled?: boolean;
    /** Enable or disable live streaming output */
    streaming_enabled?: boolean;
    /** Custom metadata */
    metadata?: Metadata;
}
/**
 * List productions filters
 */
export interface ListProductionsParams extends PaginationParams {
    /** Filter by production status */
    status?: ProductionStatus;
    /** Filter productions created after this date (ISO 8601) */
    created_after?: string;
    /** Filter productions created before this date (ISO 8601) */
    created_before?: string;
    /** Field to order results by */
    order_by?: "created_at" | "updated_at" | "title" | "started_at";
    /** Sort direction */
    order?: "asc" | "desc";
}
/**
 * Studio API client for multi-camera broadcast production
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { StudioAPI } from '@wave/sdk/studio';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const studio = new StudioAPI(client);
 *
 * // Create a production
 * const production = await studio.create({
 *   title: 'Live Show',
 *   recording_enabled: true,
 *   streaming_enabled: true,
 * });
 *
 * // Add a camera source
 * const camera = await studio.addSource(production.id, {
 *   name: 'Camera 1',
 *   type: 'camera',
 *   url: 'rtmp://ingest.wave.online/live/cam1',
 * });
 *
 * // Go live
 * await studio.start(production.id);
 *
 * // Switch program source with a dissolve
 * await studio.setProgram(production.id, camera.id, {
 *   type: 'dissolve',
 *   duration_ms: 500,
 * });
 * ```
 */
