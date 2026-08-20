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

// src/distribution.ts
var distribution_exports = {};
__export(distribution_exports, {
  DistributionAPI: () => DistributionAPI,
  createDistributionAPI: () => createDistributionAPI
});
module.exports = __toCommonJS(distribution_exports);
var DistributionAPI = class {
  client;
  basePath = "/v1/distribution";
  constructor(client) {
    this.client = client;
  }
  async listDestinations(params) {
    return this.client.get(`${this.basePath}/destinations`, {
      params
    });
  }
  async getDestination(destId) {
    return this.client.get(`${this.basePath}/destinations/${destId}`);
  }
  async addDestination(request) {
    return this.client.post(`${this.basePath}/destinations`, request);
  }
  async updateDestination(destId, updates) {
    return this.client.patch(`${this.basePath}/destinations/${destId}`, updates);
  }
  async removeDestination(destId) {
    await this.client.delete(`${this.basePath}/destinations/${destId}`);
  }
  async startSimulcast(streamId, destinationIds) {
    return this.client.post(`${this.basePath}/simulcast`, {
      stream_id: streamId,
      destination_ids: destinationIds
    });
  }
  async stopSimulcast(streamId) {
    return this.client.post(`${this.basePath}/simulcast/stop`, {
      stream_id: streamId
    });
  }
  async getSimulcastStatus(streamId) {
    return this.client.get(`${this.basePath}/simulcast/${streamId}`);
  }
  async schedulePost(request) {
    return this.client.post(`${this.basePath}/posts`, request);
  }
  async listScheduledPosts(params) {
    return this.client.get(`${this.basePath}/posts`, {
      params
    });
  }
  async cancelScheduledPost(postId) {
    await this.client.delete(`${this.basePath}/posts/${postId}`);
  }
  async getDistributionAnalytics(params) {
    return this.client.get(`${this.basePath}/analytics`, {
      params
    });
  }
};
function createDistributionAPI(client) {
  return new DistributionAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DistributionAPI,
  createDistributionAPI
});
