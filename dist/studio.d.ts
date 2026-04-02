/**
 * WAVE SDK - Studio API
 *
 * Multi-camera broadcast production system for creating, managing, and
 * controlling live productions with sources, scenes, graphics, and audio mixing.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginatedResponse } from "./client";
export * from './studio-types';
import type { AudioMixChannel, CreateProductionRequest, Graphic, LayoutType, ListProductionsParams, Production, Scene, SceneSource, Source, SourceType, TransitionConfig, UpdateProductionRequest } from './studio-types';
export declare class StudioAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a new production
     *
     * Requires: productions:create permission
     */
    create(request: CreateProductionRequest): Promise<Production>;
    /**
     * Get a production by ID
     *
     * Requires: productions:read permission
     */
    get(productionId: string): Promise<Production>;
    /**
     * Update a production
     *
     * Requires: productions:update permission
     */
    update(productionId: string, request: UpdateProductionRequest): Promise<Production>;
    /**
     * Remove a production
     *
     * Requires: productions:remove permission (server-side RBAC enforced)
     */
    remove(productionId: string): Promise<void>;
    /**
     * List productions with optional filters
     *
     * Requires: productions:read permission
     */
    list(params?: ListProductionsParams): Promise<PaginatedResponse<Production>>;
    /**
     * Start a production (go live)
     *
     * Transitions the production from 'idle' or 'rehearsal' to 'live'.
     *
     * Requires: productions:control permission
     */
    start(productionId: string): Promise<Production>;
    /**
     * Stop a production (end broadcast)
     *
     * Transitions the production to 'ending' and then 'ended'.
     *
     * Requires: productions:control permission
     */
    stop(productionId: string): Promise<Production>;
    /**
     * Start a rehearsal session
     *
     * Allows testing sources, scenes, and transitions without going live.
     * Transitions the production from 'idle' to 'rehearsal'.
     *
     * Requires: productions:control permission
     */
    startRehearsal(productionId: string): Promise<Production>;
    /**
     * Add an input source to a production
     *
     * Requires: productions:sources:create permission
     */
    addSource(productionId: string, source: {
        name: string;
        type: SourceType;
        url?: string;
        ptz_enabled?: boolean;
    }): Promise<Source>;
    /**
     * Remove a source from a production
     *
     * Requires: productions:sources:remove permission
     */
    removeSource(productionId: string, sourceId: string): Promise<void>;
    /**
     * List all sources for a production
     *
     * Requires: productions:sources:read permission
     */
    listSources(productionId: string): Promise<Source[]>;
    /**
     * Get a specific source by ID
     *
     * Requires: productions:sources:read permission
     */
    getSource(productionId: string, sourceId: string): Promise<Source>;
    /**
     * Create a new scene in a production
     *
     * Requires: productions:scenes:create permission
     */
    createScene(productionId: string, scene: {
        name: string;
        layout: LayoutType;
        sources?: SceneSource[];
        transition_in?: TransitionConfig;
    }): Promise<Scene>;
    /**
     * Update an existing scene
     *
     * Requires: productions:scenes:update permission
     */
    updateScene(productionId: string, sceneId: string, updates: Partial<{
        name: string;
        layout: LayoutType;
        sources: SceneSource[];
        transition_in: TransitionConfig;
        sort_order: number;
    }>): Promise<Scene>;
    /**
     * Remove a scene from a production
     *
     * Requires: productions:scenes:remove permission
     */
    removeScene(productionId: string, sceneId: string): Promise<void>;
    /**
     * List all scenes for a production
     *
     * Requires: productions:scenes:read permission
     */
    listScenes(productionId: string): Promise<Scene[]>;
    /**
     * Activate a scene with an optional transition
     *
     * Sets the scene as the active scene for the production output.
     *
     * Requires: productions:scenes:control permission
     */
    activateScene(productionId: string, sceneId: string, transition?: TransitionConfig): Promise<Scene>;
    /**
     * Set the program (live) source with an optional transition
     *
     * Switches the currently live output to the specified source.
     *
     * Requires: productions:control permission
     */
    setProgram(productionId: string, sourceId: string, transition?: TransitionConfig): Promise<void>;
    /**
     * Set the preview source
     *
     * Loads a source into the preview output for inspection before going live.
     *
     * Requires: productions:control permission
     */
    setPreview(productionId: string, sourceId: string): Promise<void>;
    /**
     * Execute a transition between preview and program
     *
     * Swaps the current preview source into program using the specified transition.
     *
     * Requires: productions:control permission
     */
    transition(productionId: string, config: TransitionConfig): Promise<void>;
    /**
     * Add a graphic overlay to a production
     *
     * Requires: productions:graphics:create permission
     */
    addGraphic(productionId: string, graphic: {
        name: string;
        type: Graphic["type"];
        content: Record<string, unknown>;
        position?: Graphic["position"];
        layer?: number;
    }): Promise<Graphic>;
    /**
     * Update an existing graphic
     *
     * Requires: productions:graphics:update permission
     */
    updateGraphic(productionId: string, graphicId: string, updates: Partial<{
        name: string;
        type: Graphic["type"];
        content: Record<string, unknown>;
        position: Graphic["position"];
        layer: number;
    }>): Promise<Graphic>;
    /**
     * Remove a graphic from a production
     *
     * Requires: productions:graphics:remove permission
     */
    removeGraphic(productionId: string, graphicId: string): Promise<void>;
    /**
     * Show a graphic on the production output
     *
     * Makes the graphic visible on the live output.
     *
     * Requires: productions:graphics:control permission
     */
    showGraphic(productionId: string, graphicId: string): Promise<void>;
    /**
     * Hide a graphic from the production output
     *
     * Removes the graphic from the live output without deleting it.
     *
     * Requires: productions:graphics:control permission
     */
    hideGraphic(productionId: string, graphicId: string): Promise<void>;
    /**
     * Get the current audio mix for a production
     *
     * Returns volume, mute, solo, pan, and processing settings for all channels.
     *
     * Requires: productions:audio:read permission
     */
    getAudioMix(productionId: string): Promise<AudioMixChannel[]>;
    /**
     * Set the audio mix for a production
     *
     * Updates volume, mute, solo, pan, and processing settings for channels.
     *
     * Requires: productions:audio:control permission
     */
    setAudioMix(productionId: string, channels: AudioMixChannel[]): Promise<AudioMixChannel[]>;
}
/**
 * Create a Studio API instance
 */
export declare function createStudioAPI(client: WaveClient): StudioAPI;
