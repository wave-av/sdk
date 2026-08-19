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

// src/clips.ts
var clips_exports = {};
__export(clips_exports, {
  ClipsAPI: () => ClipsAPI,
  createClipsAPI: () => createClipsAPI
});
module.exports = __toCommonJS(clips_exports);
var ClipsAPI = class {
  client;
  basePath = "/v1/clips";
  constructor(client) {
    this.client = client;
  }
  /**
   * Create a new clip
   *
   * Requires: clips:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a clip by ID
   *
   * Requires: clips:read permission
   */
  async get(clipId) {
    return this.client.get(`${this.basePath}/${clipId}`);
  }
  /**
   * Update a clip
   *
   * Requires: clips:update permission
   */
  async update(clipId, request) {
    return this.client.patch(`${this.basePath}/${clipId}`, request);
  }
  /**
   * Remove a clip
   *
   * Requires: clips:remove permission (server-side RBAC enforced)
   */
  async remove(clipId) {
    await this.client.delete(`${this.basePath}/${clipId}`);
  }
  /**
   * List clips with optional filters
   *
   * Requires: clips:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      source_type: params?.source_type,
      source_id: params?.source_id,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    if (params?.tags?.length) {
      queryParams["tags"] = params.tags.join(",");
    }
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  /**
   * Export a clip to a different format
   *
   * Requires: clips:export permission
   */
  async exportClip(clipId, request) {
    return this.client.post(
      `${this.basePath}/${clipId}/export`,
      request
    );
  }
  /**
   * Get export job status
   *
   * Requires: clips:read permission
   */
  async getExport(clipId, exportId) {
    return this.client.get(
      `${this.basePath}/${clipId}/exports/${exportId}`
    );
  }
  /**
   * List all exports for a clip
   *
   * Requires: clips:read permission
   */
  async listExports(clipId, params) {
    return this.client.get(
      `${this.basePath}/${clipId}/exports`,
      { params }
    );
  }
  /**
   * Detect highlights in source content
   *
   * Requires: clips:analyze permission
   */
  async detectHighlights(sourceType, sourceId, options) {
    return this.client.post(
      `${this.basePath}/highlights/detect`,
      {
        source_type: sourceType,
        source_id: sourceId,
        ...options
      }
    );
  }
  /**
   * Generate clips from detected highlights
   *
   * Requires: clips:create permission
   */
  async createFromHighlights(sourceType, sourceId, options) {
    return this.client.post(`${this.basePath}/highlights/create`, {
      source_type: sourceType,
      source_id: sourceId,
      ...options
    });
  }
  /**
   * Wait for a clip to be ready
   */
  async waitForReady(clipId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 3e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const clip = await this.get(clipId);
      if (options?.onProgress) {
        options.onProgress(clip);
      }
      if (clip.status === "ready") {
        return clip;
      }
      if (clip.status === "failed") {
        throw new Error(`Clip processing failed: ${clip.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Clip processing timed out after ${timeout}ms`);
  }
  /**
   * Wait for an export to be ready
   */
  async waitForExport(clipId, exportId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 3e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const exportJob = await this.getExport(clipId, exportId);
      if (exportJob.status === "ready") {
        return exportJob;
      }
      if (exportJob.status === "failed") {
        throw new Error(`Export failed: ${exportJob.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Export timed out after ${timeout}ms`);
  }
};
function createClipsAPI(client) {
  return new ClipsAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClipsAPI,
  createClipsAPI
});
