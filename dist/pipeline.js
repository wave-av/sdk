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

// src/pipeline.ts
var pipeline_exports = {};
__export(pipeline_exports, {
  PipelineAPI: () => PipelineAPI,
  createPipelineAPI: () => createPipelineAPI
});
module.exports = __toCommonJS(pipeline_exports);
var PipelineAPI = class {
  client;
  basePath = "/v1/streams";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Stream CRUD
  // ==========================================================================
  /**
   * Create a new stream
   *
   * Requires: streams:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a stream by ID
   *
   * Requires: streams:read permission
   */
  async get(streamId) {
    return this.client.get(`${this.basePath}/${streamId}`);
  }
  /**
   * Update a stream
   *
   * Requires: streams:update permission
   */
  async update(streamId, request) {
    return this.client.patch(`${this.basePath}/${streamId}`, request);
  }
  /**
   * Remove a stream
   *
   * Requires: streams:remove permission (server-side RBAC enforced)
   */
  async remove(streamId) {
    await this.client.delete(`${this.basePath}/${streamId}`);
  }
  /**
   * List streams with optional filters
   *
   * Requires: streams:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      protocol: params?.protocol,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  // ==========================================================================
  // Stream Lifecycle
  // ==========================================================================
  /**
   * Start a stream
   *
   * Transitions the stream from idle to connecting. The stream will move
   * to "live" once media is received on the ingest endpoint.
   *
   * Requires: streams:start permission
   */
  async start(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/start`);
  }
  /**
   * Stop a stream
   *
   * Gracefully ends the stream. Any active recording will be finalized.
   *
   * Requires: streams:stop permission
   */
  async stop(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/stop`);
  }
  /**
   * Switch the ingest protocol for a live stream
   *
   * Performs a zero-downtime protocol switch. The stream will briefly
   * enter "reconnecting" status during the transition.
   *
   * Requires: streams:update permission
   */
  async switchProtocol(streamId, protocol) {
    return this.client.post(`${this.basePath}/${streamId}/switch-protocol`, { protocol });
  }
  // ==========================================================================
  // Health & Monitoring
  // ==========================================================================
  /**
   * Get real-time health metrics for a stream
   *
   * Returns current bitrate, frame rate, latency, and overall health status.
   *
   * Requires: streams:read permission
   */
  async getHealth(streamId) {
    return this.client.get(`${this.basePath}/${streamId}/health`);
  }
  /**
   * Get ingest endpoints for a stream
   *
   * Returns primary and backup URLs for each configured protocol.
   *
   * Requires: streams:read permission
   */
  async getIngestEndpoints(streamId) {
    return this.client.get(`${this.basePath}/${streamId}/ingest-endpoints`);
  }
  // ==========================================================================
  // Recording
  // ==========================================================================
  /**
   * Start recording a live stream
   *
   * Begins capturing the stream to a file. The stream must be in "live" status.
   *
   * Requires: streams:record permission
   */
  async startRecording(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/recordings/start`);
  }
  /**
   * Stop recording a live stream
   *
   * Finalizes the current recording. The recording enters "processing" status
   * while it is being packaged.
   *
   * Requires: streams:record permission
   */
  async stopRecording(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/recordings/stop`);
  }
  /**
   * List recordings for a stream
   *
   * Requires: streams:read permission
   */
  async listRecordings(streamId, params) {
    return this.client.get(
      `${this.basePath}/${streamId}/recordings`,
      { params }
    );
  }
  /**
   * Get a specific recording
   *
   * Requires: streams:read permission
   */
  async getRecording(streamId, recordingId) {
    return this.client.get(
      `${this.basePath}/${streamId}/recordings/${recordingId}`
    );
  }
  // ==========================================================================
  // Viewers
  // ==========================================================================
  /**
   * List active viewer sessions for a stream
   *
   * Requires: streams:read permission
   */
  async listViewers(streamId, params) {
    return this.client.get(
      `${this.basePath}/${streamId}/viewers`,
      { params }
    );
  }
  /**
   * Get current and peak viewer count for a stream
   *
   * Requires: streams:read permission
   */
  async getViewerCount(streamId) {
    return this.client.get(
      `${this.basePath}/${streamId}/viewers/count`
    );
  }
  // ==========================================================================
  // Polling Helpers
  // ==========================================================================
  /**
   * Wait for a stream to reach "live" status
   *
   * Polls the stream until it transitions to "live" or a terminal state.
   * Useful after calling `start()` to wait for the encoder to connect.
   *
   * @param streamId - Stream to monitor
   * @param options - Polling configuration
   * @param options.pollInterval - Milliseconds between polls (default: 2000)
   * @param options.timeout - Maximum wait time in milliseconds (default: 120000)
   * @param options.onProgress - Called on each poll with the current stream state
   * @returns The stream once it reaches "live" status
   * @throws Error if the stream enters "failed" or "ended" status, or if the timeout is exceeded
   */
  async waitForLive(streamId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 12e4;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const stream = await this.get(streamId);
      if (options?.onProgress) {
        options.onProgress(stream);
      }
      if (stream.status === "live") {
        return stream;
      }
      if (stream.status === "failed") {
        throw new Error(`Stream failed to go live: ${stream.id}`);
      }
      if (stream.status === "ended") {
        throw new Error(`Stream ended before going live: ${stream.id}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Stream did not go live within ${timeout}ms`);
  }
};
function createPipelineAPI(client) {
  return new PipelineAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PipelineAPI,
  createPipelineAPI
});
