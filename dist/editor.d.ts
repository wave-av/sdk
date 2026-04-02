/**
 * WAVE SDK - Editor API
 *
 * Video editing capabilities including cuts, transitions, overlays, and effects.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
export * from './editor-types';
import type { AddElementRequest, CreateProjectRequest, EditorProject, Effect, ListProjectsParams, RenderJob, RenderOptions, TimelineElement, Track, TrackType, Transition, UpdateProjectRequest } from './editor-types';
export declare class EditorAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a new editor project
     *
     * Requires: editor:create permission
     */
    createProject(request: CreateProjectRequest): Promise<EditorProject>;
    /**
     * Get a project by ID
     *
     * Requires: editor:read permission
     */
    getProject(projectId: string): Promise<EditorProject>;
    /**
     * Update a project
     *
     * Requires: editor:update permission
     */
    updateProject(projectId: string, request: UpdateProjectRequest): Promise<EditorProject>;
    /**
     * Remove a project
     *
     * Requires: editor:remove permission (server-side RBAC enforced)
     */
    removeProject(projectId: string): Promise<void>;
    /**
     * List projects
     *
     * Requires: editor:read permission
     */
    listProjects(params?: ListProjectsParams): Promise<PaginatedResponse<EditorProject>>;
    /**
     * Duplicate a project
     *
     * Requires: editor:create permission
     */
    duplicateProject(projectId: string, name?: string): Promise<EditorProject>;
    /**
     * Add a track to a project
     *
     * Requires: editor:update permission
     */
    addTrack(projectId: string, track: {
        name: string;
        type: TrackType;
        order?: number;
    }): Promise<Track>;
    /**
     * Update a track
     *
     * Requires: editor:update permission
     */
    updateTrack(projectId: string, trackId: string, updates: Partial<Pick<Track, 'name' | 'order' | 'locked' | 'muted' | 'visible'>>): Promise<Track>;
    /**
     * Remove a track
     *
     * Requires: editor:update permission (server-side RBAC enforced)
     */
    removeTrack(projectId: string, trackId: string): Promise<void>;
    /**
     * Add an element to a track
     *
     * Requires: editor:update permission
     */
    addElement(projectId: string, element: AddElementRequest): Promise<TimelineElement>;
    /**
     * Update an element
     *
     * Requires: editor:update permission
     */
    updateElement(projectId: string, elementId: string, updates: Partial<TimelineElement>): Promise<TimelineElement>;
    /**
     * Remove an element
     *
     * Requires: editor:update permission (server-side RBAC enforced)
     */
    removeElement(projectId: string, elementId: string): Promise<void>;
    /**
     * Move an element to a different position
     *
     * Requires: editor:update permission
     */
    moveElement(projectId: string, elementId: string, options: {
        track_id?: string;
        start_time: number;
    }): Promise<TimelineElement>;
    /**
     * Trim an element
     *
     * Requires: editor:update permission
     */
    trimElement(projectId: string, elementId: string, options: {
        in_point?: number;
        out_point?: number;
    }): Promise<TimelineElement>;
    /**
     * Add a transition between elements
     *
     * Requires: editor:update permission
     */
    addTransition(projectId: string, transition: Omit<Transition, 'id'>): Promise<Transition>;
    /**
     * Update a transition
     *
     * Requires: editor:update permission
     */
    updateTransition(projectId: string, transitionId: string, updates: Partial<Transition>): Promise<Transition>;
    /**
     * Remove a transition
     *
     * Requires: editor:update permission (server-side RBAC enforced)
     */
    removeTransition(projectId: string, transitionId: string): Promise<void>;
    /**
     * Add an effect to an element
     *
     * Requires: editor:update permission
     */
    addEffect(projectId: string, effect: Omit<Effect, 'id'>): Promise<Effect>;
    /**
     * Update an effect
     *
     * Requires: editor:update permission
     */
    updateEffect(projectId: string, effectId: string, updates: Partial<Effect>): Promise<Effect>;
    /**
     * Remove an effect
     *
     * Requires: editor:update permission (server-side RBAC enforced)
     */
    removeEffect(projectId: string, effectId: string): Promise<void>;
    /**
     * Start rendering a project
     *
     * Requires: editor:render permission
     */
    render(projectId: string, options?: RenderOptions): Promise<RenderJob>;
    /**
     * Get render job status
     *
     * Requires: editor:read permission
     */
    getRenderJob(projectId: string, jobId: string): Promise<RenderJob>;
    /**
     * List render jobs for a project
     *
     * Requires: editor:read permission
     */
    listRenderJobs(projectId: string, params?: PaginationParams): Promise<PaginatedResponse<RenderJob>>;
    /**
     * Cancel a render job
     *
     * Requires: editor:render permission
     */
    cancelRenderJob(projectId: string, jobId: string): Promise<RenderJob>;
    /**
     * Wait for render to complete
     */
    waitForRender(projectId: string, jobId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (job: RenderJob) => void;
    }): Promise<RenderJob>;
    /**
     * Generate a preview frame
     *
     * Requires: editor:read permission
     */
    getPreviewFrame(projectId: string, time: number, options?: {
        width?: number;
        height?: number;
        format?: 'png' | 'jpeg';
    }): Promise<{
        url: string;
        expires_at: string;
    }>;
    /**
     * Generate a preview video segment
     *
     * Requires: editor:read permission
     */
    getPreviewSegment(projectId: string, startTime: number, endTime: number, options?: {
        quality?: 'low' | 'medium';
    }): Promise<{
        url: string;
        expires_at: string;
    }>;
}
/**
 * Create an Editor API instance
 */
export declare function createEditorAPI(client: WaveClient): EditorAPI;
