"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/editor.ts
var editor_exports = {};
__export(editor_exports, {
  EditorAPI: () => EditorAPI,
  createEditorAPI: () => createEditorAPI
});
module.exports = __toCommonJS(editor_exports);
var EditorAPI = class {
  client;
  basePath = "/v1/editor/projects";
  constructor(client) {
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
  async createProject(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a project by ID
   *
   * Requires: editor:read permission
   */
  async getProject(projectId) {
    return this.client.get(`${this.basePath}/${projectId}`);
  }
  /**
   * Update a project
   *
   * Requires: editor:update permission
   */
  async updateProject(projectId, request) {
    return this.client.patch(`${this.basePath}/${projectId}`, request);
  }
  /**
   * Remove a project
   *
   * Requires: editor:remove permission (server-side RBAC enforced)
   */
  async removeProject(projectId) {
    await this.client.delete(`${this.basePath}/${projectId}`);
  }
  /**
   * List projects
   *
   * Requires: editor:read permission
   */
  async listProjects(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /**
   * Duplicate a project
   *
   * Requires: editor:create permission
   */
  async duplicateProject(projectId, name) {
    return this.client.post(`${this.basePath}/${projectId}/duplicate`, {
      name
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
  async addTrack(projectId, track) {
    return this.client.post(`${this.basePath}/${projectId}/tracks`, track);
  }
  /**
   * Update a track
   *
   * Requires: editor:update permission
   */
  async updateTrack(projectId, trackId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      updates
    );
  }
  /**
   * Remove a track
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTrack(projectId, trackId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      { method: "DELETE" }
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
  async addElement(projectId, element) {
    return this.client.post(
      `${this.basePath}/${projectId}/elements`,
      element
    );
  }
  /**
   * Update an element
   *
   * Requires: editor:update permission
   */
  async updateElement(projectId, elementId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      updates
    );
  }
  /**
   * Remove an element
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeElement(projectId, elementId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Move an element to a different position
   *
   * Requires: editor:update permission
   */
  async moveElement(projectId, elementId, options) {
    return this.client.post(
      `${this.basePath}/${projectId}/elements/${elementId}/move`,
      options
    );
  }
  /**
   * Trim an element
   *
   * Requires: editor:update permission
   */
  async trimElement(projectId, elementId, options) {
    return this.client.post(
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
  async addTransition(projectId, transition) {
    return this.client.post(
      `${this.basePath}/${projectId}/transitions`,
      transition
    );
  }
  /**
   * Update a transition
   *
   * Requires: editor:update permission
   */
  async updateTransition(projectId, transitionId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      updates
    );
  }
  /**
   * Remove a transition
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTransition(projectId, transitionId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      { method: "DELETE" }
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
  async addEffect(projectId, effect) {
    return this.client.post(
      `${this.basePath}/${projectId}/effects`,
      effect
    );
  }
  /**
   * Update an effect
   *
   * Requires: editor:update permission
   */
  async updateEffect(projectId, effectId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      updates
    );
  }
  /**
   * Remove an effect
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeEffect(projectId, effectId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      { method: "DELETE" }
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
  async render(projectId, options) {
    return this.client.post(
      `${this.basePath}/${projectId}/render`,
      options
    );
  }
  /**
   * Get render job status
   *
   * Requires: editor:read permission
   */
  async getRenderJob(projectId, jobId) {
    return this.client.get(
      `${this.basePath}/${projectId}/render/${jobId}`
    );
  }
  /**
   * List render jobs for a project
   *
   * Requires: editor:read permission
   */
  async listRenderJobs(projectId, params) {
    return this.client.get(
      `${this.basePath}/${projectId}/render`,
      { params }
    );
  }
  /**
   * Cancel a render job
   *
   * Requires: editor:render permission
   */
  async cancelRenderJob(projectId, jobId) {
    return this.client.post(
      `${this.basePath}/${projectId}/render/${jobId}/cancel`
    );
  }
  /**
   * Wait for render to complete
   */
  async waitForRender(projectId, jobId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const job = await this.getRenderJob(projectId, jobId);
      if (options?.onProgress) {
        options.onProgress(job);
      }
      if (job.status === "ready") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(`Render failed: ${job.error || "Unknown error"}`);
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
  async getPreviewFrame(projectId, time, options) {
    return this.client.get(`${this.basePath}/${projectId}/preview`, {
      params: { time, ...options }
    });
  }
  /**
   * Generate a preview video segment
   *
   * Requires: editor:read permission
   */
  async getPreviewSegment(projectId, startTime, endTime, options) {
    return this.client.post(`${this.basePath}/${projectId}/preview/segment`, {
      start_time: startTime,
      end_time: endTime,
      ...options
    });
  }
};
function createEditorAPI(client) {
  return new EditorAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EditorAPI,
  createEditorAPI
});
