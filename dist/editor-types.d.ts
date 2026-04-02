/**
 * WAVE SDK - Editor API
 *
 * Video editing capabilities including cuts, transitions, overlays, and effects.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { PaginationParams, Timestamps, Metadata } from './client';
/**
 * Project status
 */
export type ProjectStatus = 'draft' | 'rendering' | 'ready' | 'failed' | 'archived';
/**
 * Track type
 */
export type TrackType = 'video' | 'audio' | 'text' | 'image' | 'effect';
/**
 * Transition type
 */
export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';
/**
 * Effect type
 */
export type EffectType = 'blur' | 'brightness' | 'contrast' | 'saturation' | 'color_grade' | 'noise_reduction' | 'stabilization' | 'speed' | 'reverse' | 'custom';
/**
 * Timeline element
 */
export interface TimelineElement {
    id: string;
    track_id: string;
    type: 'clip' | 'text' | 'image' | 'audio' | 'effect';
    source_id?: string;
    start_time: number;
    duration: number;
    in_point?: number;
    out_point?: number;
    properties?: Record<string, unknown>;
}
/**
 * Track definition
 */
export interface Track {
    id: string;
    name: string;
    type: TrackType;
    order: number;
    locked: boolean;
    muted: boolean;
    visible: boolean;
    elements: TimelineElement[];
}
/**
 * Transition definition
 */
export interface Transition {
    id: string;
    type: TransitionType;
    from_element_id: string;
    to_element_id: string;
    duration: number;
    properties?: Record<string, unknown>;
}
/**
 * Effect definition
 */
export interface Effect {
    id: string;
    type: EffectType;
    element_id: string;
    start_time: number;
    end_time: number;
    keyframes?: Keyframe[];
    properties: Record<string, unknown>;
}
/**
 * Keyframe for animation
 */
export interface Keyframe {
    time: number;
    value: number | string | Record<string, unknown>;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
}
/**
 * Text overlay
 */
export interface TextOverlay {
    id: string;
    content: string;
    font_family: string;
    font_size: number;
    font_weight?: number;
    color: string;
    background_color?: string;
    position: {
        x: number;
        y: number;
    };
    alignment?: 'left' | 'center' | 'right';
    animation?: TextAnimation;
}
/**
 * Text animation
 */
export interface TextAnimation {
    type: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
    duration: number;
    delay?: number;
}
/**
 * Editor project
 */
export interface EditorProject extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    width: number;
    height: number;
    frame_rate: number;
    duration: number;
    tracks: Track[];
    transitions: Transition[];
    effects: Effect[];
    thumbnail_url?: string;
    output_url?: string;
    metadata?: Metadata;
    version: number;
}
/**
 * Create project request
 */
export interface CreateProjectRequest {
    name: string;
    description?: string;
    width?: number;
    height?: number;
    frame_rate?: number;
    template_id?: string;
    metadata?: Metadata;
}
/**
 * Update project request
 */
export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    metadata?: Metadata;
}
/**
 * Add element request
 */
export interface AddElementRequest {
    track_id: string;
    type: 'clip' | 'text' | 'image' | 'audio';
    source_id?: string;
    start_time: number;
    duration?: number;
    properties?: Record<string, unknown>;
}
/**
 * Render options
 */
export interface RenderOptions {
    format?: 'mp4' | 'webm' | 'mov' | 'gif';
    quality?: 'low' | 'medium' | 'high' | 'source';
    resolution?: string;
    bitrate?: number;
    audio_codec?: 'aac' | 'mp3' | 'opus';
    audio_bitrate?: number;
    webhook_url?: string;
}
/**
 * Render job
 */
export interface RenderJob extends Timestamps {
    id: string;
    project_id: string;
    status: 'pending' | 'rendering' | 'ready' | 'failed';
    progress: number;
    output_url?: string;
    file_size?: number;
    duration?: number;
    error?: string;
}
/**
 * List projects params
 */
export interface ListProjectsParams extends PaginationParams {
    status?: ProjectStatus;
    created_after?: string;
    created_before?: string;
    order_by?: 'created_at' | 'updated_at' | 'name';
    order?: 'asc' | 'desc';
}
/**
 * Editor API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { EditorAPI } from '@wave/sdk/editor';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const editor = new EditorAPI(client);
 *
 * // Create a new project
 * const project = await editor.createProject({
 *   name: 'My Video',
 *   width: 1920,
 *   height: 1080,
 *   frame_rate: 30,
 * });
 *
 * // Add a video track
 * const track = await editor.addTrack(project.id, {
 *   name: 'Main Video',
 *   type: 'video',
 * });
 *
 * // Add a clip to the track
 * await editor.addElement(project.id, {
 *   track_id: track.id,
 *   type: 'clip',
 *   source_id: 'clip_123',
 *   start_time: 0,
 * });
 *
 * // Render the project
 * const job = await editor.render(project.id, { format: 'mp4' });
 * ```
 */
