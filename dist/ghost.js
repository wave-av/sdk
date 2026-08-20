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

// src/ghost.ts
var ghost_exports = {};
__export(ghost_exports, {
  GhostAPI: () => GhostAPI,
  createGhostAPI: () => createGhostAPI
});
module.exports = __toCommonJS(ghost_exports);
var GhostAPI = class {
  client;
  basePath = "/v1/productions";
  constructor(client) {
    this.client = client;
  }
  /**
   * Start an Autopilot directing session
   *
   * Requires: ghost:create permission
   */
  async start(request) {
    return this.client.post(
      `${this.basePath}/${request.production_id}/ghost`,
      request
    );
  }
  /**
   * Get the current Autopilot session for a production
   *
   * Requires: ghost:read permission
   */
  async get(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost`);
  }
  /**
   * Update an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async update(productionId, request) {
    return this.client.patch(`${this.basePath}/${productionId}/ghost`, request);
  }
  /**
   * Stop an Autopilot session
   *
   * Requires: ghost:stop permission
   */
  async stop(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/stop`);
  }
  /**
   * Pause an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async pause(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/pause`);
  }
  /**
   * Resume a paused Autopilot session
   *
   * Requires: ghost:update permission
   */
  async resume(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/resume`);
  }
  /**
   * Override the current shot with a manual selection
   *
   * Requires: ghost:override permission
   */
  async override(productionId, override) {
    await this.client.post(`${this.basePath}/${productionId}/ghost/override`, override);
  }
  /**
   * List AI suggestions for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async listSuggestions(productionId, params) {
    return this.client.get(
      `${this.basePath}/${productionId}/ghost/suggestions`,
      { params }
    );
  }
  /**
   * Accept an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async acceptSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/accept`
    );
  }
  /**
   * Reject an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async rejectSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/reject`
    );
  }
  /**
   * Get directing statistics for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async getStats(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost/stats`);
  }
};
function createGhostAPI(client) {
  return new GhostAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GhostAPI,
  createGhostAPI
});
