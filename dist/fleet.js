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

// src/fleet.ts
var fleet_exports = {};
__export(fleet_exports, {
  FleetAPI: () => FleetAPI,
  createFleetAPI: () => createFleetAPI
});
module.exports = __toCommonJS(fleet_exports);
var FleetAPI = class {
  client;
  basePath = "/v1/fleet/nodes";
  constructor(client) {
    this.client = client;
  }
  /**
   * List fleet nodes with optional filters
   *
   * Requires: fleet:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      health: params?.health,
      os: params?.os,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  /**
   * Get a node by ID
   *
   * Requires: fleet:read permission
   */
  async get(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}`);
  }
  /**
   * Register a new node
   *
   * Requires: fleet:create permission
   */
  async register(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Update a node
   *
   * Requires: fleet:update permission
   */
  async update(nodeId, request) {
    return this.client.patch(`${this.basePath}/${nodeId}`, request);
  }
  /**
   * Deregister (remove) a node
   *
   * Requires: fleet:remove permission (server-side RBAC enforced)
   */
  async deregister(nodeId) {
    await this.client.delete(`${this.basePath}/${nodeId}`);
  }
  /**
   * Get current health status of a node
   *
   * Requires: fleet:read permission
   */
  async getHealth(nodeId) {
    return this.client.get(
      `${this.basePath}/${nodeId}/health`
    );
  }
  /**
   * List devices attached to a node
   *
   * Requires: fleet:read permission
   */
  async listDevices(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}/devices`);
  }
  /**
   * Send a command to a node
   *
   * Requires: fleet:command permission
   */
  async sendCommand(nodeId, command) {
    return this.client.post(
      `${this.basePath}/${nodeId}/commands`,
      command
    );
  }
  /**
   * Get current resource metrics for a node
   *
   * Requires: fleet:read permission
   */
  async getMetrics(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}/metrics`);
  }
  /**
   * Wait for a node to come online
   */
  async waitForOnline(nodeId, options) {
    const pollInterval = options?.pollInterval || 5e3;
    const timeout = options?.timeout || 12e4;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const node = await this.get(nodeId);
      if (options?.onProgress) {
        options.onProgress(node);
      }
      if (node.status === "online") {
        return node;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Node ${nodeId} did not come online within ${timeout}ms`);
  }
};
function createFleetAPI(client) {
  return new FleetAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FleetAPI,
  createFleetAPI
});
