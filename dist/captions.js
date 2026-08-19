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

// src/captions.ts
var captions_exports = {};
__export(captions_exports, {
  CaptionsAPI: () => CaptionsAPI,
  createCaptionsAPI: () => createCaptionsAPI
});
module.exports = __toCommonJS(captions_exports);
var CaptionsAPI = class {
  client;
  basePath = "/v1/captions";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Caption Tracks
  // ==========================================================================
  /**
   * Generate captions using AI
   *
   * Requires: captions:generate permission
   */
  async generate(request) {
    return this.client.post(`${this.basePath}/generate`, request);
  }
  /**
   * Upload existing captions
   *
   * Requires: captions:create permission
   */
  async upload(request) {
    return this.client.post(`${this.basePath}/upload`, request);
  }
  /**
   * Get a caption track by ID
   *
   * Requires: captions:read permission
   */
  async get(trackId) {
    return this.client.get(`${this.basePath}/${trackId}`);
  }
  /**
   * Update a caption track
   *
   * Requires: captions:update permission
   */
  async update(trackId, request) {
    return this.client.patch(`${this.basePath}/${trackId}`, request);
  }
  /**
   * Remove a caption track
   *
   * Requires: captions:remove permission (server-side RBAC enforced)
   */
  async remove(trackId) {
    await this.client.delete(
      `${this.basePath}/${trackId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List caption tracks
   *
   * Requires: captions:read permission
   */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /**
   * Get caption tracks for a specific media
   *
   * Requires: captions:read permission
   */
  async getForMedia(mediaId, mediaType) {
    const result = await this.list({ media_id: mediaId, media_type: mediaType });
    return result.data;
  }
  // ==========================================================================
  // Caption Cues
  // ==========================================================================
  /**
   * Get caption cues (segments)
   *
   * Requires: captions:read permission
   */
  async getCues(trackId, params) {
    return this.client.get(
      `${this.basePath}/${trackId}/cues`,
      { params }
    );
  }
  /**
   * Update a caption cue
   *
   * Requires: captions:update permission
   */
  async updateCue(trackId, cueId, updates) {
    return this.client.patch(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      updates
    );
  }
  /**
   * Add a new caption cue
   *
   * Requires: captions:update permission
   */
  async addCue(trackId, cue) {
    return this.client.post(
      `${this.basePath}/${trackId}/cues`,
      cue
    );
  }
  /**
   * Remove a caption cue
   *
   * Requires: captions:update permission (server-side RBAC enforced)
   */
  async removeCue(trackId, cueId) {
    await this.client.delete(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Bulk update cues
   *
   * Requires: captions:update permission
   */
  async bulkUpdateCues(trackId, updates) {
    return this.client.post(`${this.basePath}/${trackId}/cues/bulk`, { updates });
  }
  // ==========================================================================
  // Translation
  // ==========================================================================
  /**
   * Translate a caption track to another language
   *
   * Requires: captions:translate permission
   */
  async translate(trackId, request) {
    return this.client.post(
      `${this.basePath}/${trackId}/translate`,
      request
    );
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export captions in a specific format
   *
   * Requires: captions:read permission
   */
  async exportFormat(trackId, format) {
    return this.client.get(`${this.basePath}/${trackId}/export`, {
      params: { format }
    });
  }
  /**
   * Get captions as plain text
   *
   * Requires: captions:read permission
   */
  async getText(trackId) {
    const result = await this.client.get(
      `${this.basePath}/${trackId}/text`
    );
    return result.text;
  }
  // ==========================================================================
  // Burn-In
  // ==========================================================================
  /**
   * Burn captions into video
   *
   * Requires: captions:burnin permission
   */
  async burnIn(request) {
    return this.client.post(`${this.basePath}/burn-in`, request);
  }
  /**
   * Get burn-in job status
   *
   * Requires: captions:read permission
   */
  async getBurnInJob(jobId) {
    return this.client.get(`${this.basePath}/burn-in/${jobId}`);
  }
  /**
   * Wait for burn-in to complete
   */
  async waitForBurnIn(jobId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const job = await this.getBurnInJob(jobId);
      if (options?.onProgress) {
        options.onProgress(job);
      }
      if (job.status === "ready") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(`Burn-in failed: ${job.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Burn-in timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for caption generation to complete
   */
  async waitForReady(trackId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const track = await this.get(trackId);
      if (options?.onProgress) {
        options.onProgress(track);
      }
      if (track.status === "ready") {
        return track;
      }
      if (track.status === "failed") {
        throw new Error(`Caption generation failed: ${track.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Caption generation timed out after ${timeout}ms`);
  }
  /**
   * Get supported languages
   *
   * Requires: captions:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
  /**
   * Detect language from audio
   *
   * Requires: captions:generate permission
   */
  async detectLanguage(mediaId, mediaType) {
    return this.client.post(`${this.basePath}/detect-language`, {
      media_id: mediaId,
      media_type: mediaType
    });
  }
};
function createCaptionsAPI(client) {
  return new CaptionsAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CaptionsAPI,
  createCaptionsAPI
});
