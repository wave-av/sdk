/**
 * WAVE SDK - Studio API
 *
 * Multi-camera broadcast production system for creating, managing, and
 * controlling live productions with sources, scenes, graphics, and audio mixing.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginatedResponse,
} from "./client";

export * from './studio-types';
import type {
  AudioMixChannel,
  CreateProductionRequest,
  Graphic,
  LayoutType,
  ListProductionsParams,
  Production,
  Scene,
  SceneSource,
  Source,
  SourceType,
  TransitionConfig,
  UpdateProductionRequest,
} from './studio-types';

export class StudioAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/productions";

  constructor(client: WaveClient) {
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
  async create(request: CreateProductionRequest): Promise<Production> {
    return this.client.post<Production>(this.basePath, request);
  }

  /**
   * Get a production by ID
   *
   * Requires: productions:read permission
   */
  async get(productionId: string): Promise<Production> {
    return this.client.get<Production>(`${this.basePath}/${productionId}`);
  }

  /**
   * Update a production
   *
   * Requires: productions:update permission
   */
  async update(productionId: string, request: UpdateProductionRequest): Promise<Production> {
    return this.client.patch<Production>(`${this.basePath}/${productionId}`, request);
  }

  /**
   * Remove a production
   *
   * Requires: productions:remove permission (server-side RBAC enforced)
   */
  async remove(productionId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${productionId}`);
  }

  /**
   * List productions with optional filters
   *
   * Requires: productions:read permission
   */
  async list(params?: ListProductionsParams): Promise<PaginatedResponse<Production>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order,
    };

    return this.client.get<PaginatedResponse<Production>>(this.basePath, {
      params: queryParams,
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
  async start(productionId: string): Promise<Production> {
    return this.client.post<Production>(`${this.basePath}/${productionId}/start`);
  }

  /**
   * Stop a production (end broadcast)
   *
   * Transitions the production to 'ending' and then 'ended'.
   *
   * Requires: productions:control permission
   */
  async stop(productionId: string): Promise<Production> {
    return this.client.post<Production>(`${this.basePath}/${productionId}/stop`);
  }

  /**
   * Start a rehearsal session
   *
   * Allows testing sources, scenes, and transitions without going live.
   * Transitions the production from 'idle' to 'rehearsal'.
   *
   * Requires: productions:control permission
   */
  async startRehearsal(productionId: string): Promise<Production> {
    return this.client.post<Production>(`${this.basePath}/${productionId}/rehearsal`);
  }

  // ==========================================================================
  // Sources
  // ==========================================================================

  /**
   * Add an input source to a production
   *
   * Requires: productions:sources:create permission
   */
  async addSource(
    productionId: string,
    source: {
      name: string;
      type: SourceType;
      url?: string;
      ptz_enabled?: boolean;
    },
  ): Promise<Source> {
    return this.client.post<Source>(`${this.basePath}/${productionId}/sources`, source);
  }

  /**
   * Remove a source from a production
   *
   * Requires: productions:sources:remove permission
   */
  async removeSource(productionId: string, sourceId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }

  /**
   * List all sources for a production
   *
   * Requires: productions:sources:read permission
   */
  async listSources(productionId: string): Promise<Source[]> {
    return this.client.get<Source[]>(`${this.basePath}/${productionId}/sources`);
  }

  /**
   * Get a specific source by ID
   *
   * Requires: productions:sources:read permission
   */
  async getSource(productionId: string, sourceId: string): Promise<Source> {
    return this.client.get<Source>(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }

  // ==========================================================================
  // Scenes
  // ==========================================================================

  /**
   * Create a new scene in a production
   *
   * Requires: productions:scenes:create permission
   */
  async createScene(
    productionId: string,
    scene: {
      name: string;
      layout: LayoutType;
      sources?: SceneSource[];
      transition_in?: TransitionConfig;
    },
  ): Promise<Scene> {
    return this.client.post<Scene>(`${this.basePath}/${productionId}/scenes`, scene);
  }

  /**
   * Update an existing scene
   *
   * Requires: productions:scenes:update permission
   */
  async updateScene(
    productionId: string,
    sceneId: string,
    updates: Partial<{
      name: string;
      layout: LayoutType;
      sources: SceneSource[];
      transition_in: TransitionConfig;
      sort_order: number;
    }>,
  ): Promise<Scene> {
    return this.client.patch<Scene>(`${this.basePath}/${productionId}/scenes/${sceneId}`, updates);
  }

  /**
   * Remove a scene from a production
   *
   * Requires: productions:scenes:remove permission
   */
  async removeScene(productionId: string, sceneId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${productionId}/scenes/${sceneId}`);
  }

  /**
   * List all scenes for a production
   *
   * Requires: productions:scenes:read permission
   */
  async listScenes(productionId: string): Promise<Scene[]> {
    return this.client.get<Scene[]>(`${this.basePath}/${productionId}/scenes`);
  }

  /**
   * Activate a scene with an optional transition
   *
   * Sets the scene as the active scene for the production output.
   *
   * Requires: productions:scenes:control permission
   */
  async activateScene(
    productionId: string,
    sceneId: string,
    transition?: TransitionConfig,
  ): Promise<Scene> {
    return this.client.post<Scene>(
      `${this.basePath}/${productionId}/scenes/${sceneId}/activate`,
      transition ? { transition } : undefined,
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
  async setProgram(
    productionId: string,
    sourceId: string,
    transition?: TransitionConfig,
  ): Promise<void> {
    await this.client.post(`${this.basePath}/${productionId}/program`, {
      source_id: sourceId,
      transition,
    });
  }

  /**
   * Set the preview source
   *
   * Loads a source into the preview output for inspection before going live.
   *
   * Requires: productions:control permission
   */
  async setPreview(productionId: string, sourceId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${productionId}/preview`, { source_id: sourceId });
  }

  /**
   * Execute a transition between preview and program
   *
   * Swaps the current preview source into program using the specified transition.
   *
   * Requires: productions:control permission
   */
  async transition(productionId: string, config: TransitionConfig): Promise<void> {
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
  async addGraphic(
    productionId: string,
    graphic: {
      name: string;
      type: Graphic["type"];
      content: Record<string, unknown>;
      position?: Graphic["position"];
      layer?: number;
    },
  ): Promise<Graphic> {
    return this.client.post<Graphic>(`${this.basePath}/${productionId}/graphics`, graphic);
  }

  /**
   * Update an existing graphic
   *
   * Requires: productions:graphics:update permission
   */
  async updateGraphic(
    productionId: string,
    graphicId: string,
    updates: Partial<{
      name: string;
      type: Graphic["type"];
      content: Record<string, unknown>;
      position: Graphic["position"];
      layer: number;
    }>,
  ): Promise<Graphic> {
    return this.client.patch<Graphic>(
      `${this.basePath}/${productionId}/graphics/${graphicId}`,
      updates,
    );
  }

  /**
   * Remove a graphic from a production
   *
   * Requires: productions:graphics:remove permission
   */
  async removeGraphic(productionId: string, graphicId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${productionId}/graphics/${graphicId}`);
  }

  /**
   * Show a graphic on the production output
   *
   * Makes the graphic visible on the live output.
   *
   * Requires: productions:graphics:control permission
   */
  async showGraphic(productionId: string, graphicId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${productionId}/graphics/${graphicId}/show`);
  }

  /**
   * Hide a graphic from the production output
   *
   * Removes the graphic from the live output without deleting it.
   *
   * Requires: productions:graphics:control permission
   */
  async hideGraphic(productionId: string, graphicId: string): Promise<void> {
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
  async getAudioMix(productionId: string): Promise<AudioMixChannel[]> {
    return this.client.get<AudioMixChannel[]>(`${this.basePath}/${productionId}/audio-mix`);
  }

  /**
   * Set the audio mix for a production
   *
   * Updates volume, mute, solo, pan, and processing settings for channels.
   *
   * Requires: productions:audio:control permission
   */
  async setAudioMix(productionId: string, channels: AudioMixChannel[]): Promise<AudioMixChannel[]> {
    return this.client.put<AudioMixChannel[]>(`${this.basePath}/${productionId}/audio-mix`, {
      channels,
    });
  }
}

/**
 * Create a Studio API instance
 */
export function createStudioAPI(client: WaveClient): StudioAPI {
  return new StudioAPI(client);
}
