/**
 * WAVE SDK - Editor API
 *
 * Video editing capabilities including cuts, transitions, overlays, and effects.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
} from './client';

// Types extracted to editor-types.ts — re-export all for backwards compat
export * from './editor-types';
import type {
  AddElementRequest,
  CreateProjectRequest,
  EditorProject,
  Effect,
  ListProjectsParams,
  RenderJob,
  RenderOptions,
  TimelineElement,
  Track,
  TrackType,
  Transition,
  UpdateProjectRequest,
} from './editor-types';

export class EditorAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/editor/projects';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Projects
  // ==========================================================================

  /**
   * Create a new editor project
   *
   * Requires: editor:create permission
   */
  async createProject(request: CreateProjectRequest): Promise<EditorProject> {
    return this.client.post<EditorProject>(this.basePath, request);
  }

  /**
   * Get a project by ID
   *
   * Requires: editor:read permission
   */
  async getProject(projectId: string): Promise<EditorProject> {
    return this.client.get<EditorProject>(`${this.basePath}/${projectId}`);
  }

  /**
   * Update a project
   *
   * Requires: editor:update permission
   */
  async updateProject(
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<EditorProject> {
    return this.client.patch<EditorProject>(`${this.basePath}/${projectId}`, request);
  }

  /**
   * Remove a project
   *
   * Requires: editor:remove permission (server-side RBAC enforced)
   */
  async removeProject(projectId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${projectId}`);
  }

  /**
   * List projects
   *
   * Requires: editor:read permission
   */
  async listProjects(params?: ListProjectsParams): Promise<PaginatedResponse<EditorProject>> {
    return this.client.get<PaginatedResponse<EditorProject>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Duplicate a project
   *
   * Requires: editor:create permission
   */
  async duplicateProject(projectId: string, name?: string): Promise<EditorProject> {
    return this.client.post<EditorProject>(`${this.basePath}/${projectId}/duplicate`, {
      name,
    });
  }

  // ==========================================================================
  // Tracks
  // ==========================================================================

  /**
   * Add a track to a project
   *
   * Requires: editor:update permission
   */
  async addTrack(
    projectId: string,
    track: { name: string; type: TrackType; order?: number }
  ): Promise<Track> {
    return this.client.post<Track>(`${this.basePath}/${projectId}/tracks`, track);
  }

  /**
   * Update a track
   *
   * Requires: editor:update permission
   */
  async updateTrack(
    projectId: string,
    trackId: string,
    updates: Partial<Pick<Track, 'name' | 'order' | 'locked' | 'muted' | 'visible'>>
  ): Promise<Track> {
    return this.client.patch<Track>(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      updates
    );
  }

  /**
   * Remove a track
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTrack(projectId: string, trackId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================================================
  // Elements
  // ==========================================================================

  /**
   * Add an element to a track
   *
   * Requires: editor:update permission
   */
  async addElement(projectId: string, element: AddElementRequest): Promise<TimelineElement> {
    return this.client.post<TimelineElement>(
      `${this.basePath}/${projectId}/elements`,
      element
    );
  }

  /**
   * Update an element
   *
   * Requires: editor:update permission
   */
  async updateElement(
    projectId: string,
    elementId: string,
    updates: Partial<TimelineElement>
  ): Promise<TimelineElement> {
    return this.client.patch<TimelineElement>(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      updates
    );
  }

  /**
   * Remove an element
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeElement(projectId: string, elementId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Move an element to a different position
   *
   * Requires: editor:update permission
   */
  async moveElement(
    projectId: string,
    elementId: string,
    options: { track_id?: string; start_time: number }
  ): Promise<TimelineElement> {
    return this.client.post<TimelineElement>(
      `${this.basePath}/${projectId}/elements/${elementId}/move`,
      options
    );
  }

  /**
   * Trim an element
   *
   * Requires: editor:update permission
   */
  async trimElement(
    projectId: string,
    elementId: string,
    options: { in_point?: number; out_point?: number }
  ): Promise<TimelineElement> {
    return this.client.post<TimelineElement>(
      `${this.basePath}/${projectId}/elements/${elementId}/trim`,
      options
    );
  }

  // ==========================================================================
  // Transitions
  // ==========================================================================

  /**
   * Add a transition between elements
   *
   * Requires: editor:update permission
   */
  async addTransition(
    projectId: string,
    transition: Omit<Transition, 'id'>
  ): Promise<Transition> {
    return this.client.post<Transition>(
      `${this.basePath}/${projectId}/transitions`,
      transition
    );
  }

  /**
   * Update a transition
   *
   * Requires: editor:update permission
   */
  async updateTransition(
    projectId: string,
    transitionId: string,
    updates: Partial<Transition>
  ): Promise<Transition> {
    return this.client.patch<Transition>(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      updates
    );
  }

  /**
   * Remove a transition
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTransition(projectId: string, transitionId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * Add an effect to an element
   *
   * Requires: editor:update permission
   */
  async addEffect(projectId: string, effect: Omit<Effect, 'id'>): Promise<Effect> {
    return this.client.post<Effect>(
      `${this.basePath}/${projectId}/effects`,
      effect
    );
  }

  /**
   * Update an effect
   *
   * Requires: editor:update permission
   */
  async updateEffect(
    projectId: string,
    effectId: string,
    updates: Partial<Effect>
  ): Promise<Effect> {
    return this.client.patch<Effect>(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      updates
    );
  }

  /**
   * Remove an effect
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeEffect(projectId: string, effectId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Start rendering a project
   *
   * Requires: editor:render permission
   */
  async render(projectId: string, options?: RenderOptions): Promise<RenderJob> {
    return this.client.post<RenderJob>(
      `${this.basePath}/${projectId}/render`,
      options
    );
  }

  /**
   * Get render job status
   *
   * Requires: editor:read permission
   */
  async getRenderJob(projectId: string, jobId: string): Promise<RenderJob> {
    return this.client.get<RenderJob>(
      `${this.basePath}/${projectId}/render/${jobId}`
    );
  }

  /**
   * List render jobs for a project
   *
   * Requires: editor:read permission
   */
  async listRenderJobs(
    projectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<RenderJob>> {
    return this.client.get<PaginatedResponse<RenderJob>>(
      `${this.basePath}/${projectId}/render`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Cancel a render job
   *
   * Requires: editor:render permission
   */
  async cancelRenderJob(projectId: string, jobId: string): Promise<RenderJob> {
    return this.client.post<RenderJob>(
      `${this.basePath}/${projectId}/render/${jobId}/cancel`
    );
  }

  /**
   * Wait for render to complete
   */
  async waitForRender(
    projectId: string,
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: RenderJob) => void;
    }
  ): Promise<RenderJob> {
    const pollInterval = options?.pollInterval || 3000;
    const timeout = options?.timeout || 1800000; // 30 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getRenderJob(projectId, jobId);

      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'ready') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(`Render failed: ${job.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Render timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Preview
  // ==========================================================================

  /**
   * Generate a preview frame
   *
   * Requires: editor:read permission
   */
  async getPreviewFrame(
    projectId: string,
    time: number,
    options?: { width?: number; height?: number; format?: 'png' | 'jpeg' }
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.get(`${this.basePath}/${projectId}/preview`, {
      params: { time, ...options } as unknown as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Generate a preview video segment
   *
   * Requires: editor:read permission
   */
  async getPreviewSegment(
    projectId: string,
    startTime: number,
    endTime: number,
    options?: { quality?: 'low' | 'medium' }
  ): Promise<{ url: string; expires_at: string }> {
    return this.client.post(`${this.basePath}/${projectId}/preview/segment`, {
      start_time: startTime,
      end_time: endTime,
      ...options,
    });
  }
}

/**
 * Create an Editor API instance
 */
export function createEditorAPI(client: WaveClient): EditorAPI {
  return new EditorAPI(client);
}
