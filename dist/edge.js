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

// src/edge.ts
var edge_exports = {};
__export(edge_exports, {
  EdgeAPI: () => EdgeAPI,
  createEdgeAPI: () => createEdgeAPI
});
module.exports = __toCommonJS(edge_exports);
var EdgeAPI = class {
  client;
  basePath = "/v1/edge";
  constructor(client) {
    this.client = client;
  }
  async listNodes(params) {
    return this.client.get(`${this.basePath}/nodes`, {
      params
    });
  }
  async getNode(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}`);
  }
  async getNodeMetrics(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/metrics`);
  }
  async deployWorker(request) {
    return this.client.post(`${this.basePath}/workers`, request);
  }
  async getWorker(workerId) {
    return this.client.get(`${this.basePath}/workers/${workerId}`);
  }
  async updateWorker(workerId, config) {
    return this.client.patch(`${this.basePath}/workers/${workerId}`, config);
  }
  async removeWorker(workerId) {
    await this.client.delete(`${this.basePath}/workers/${workerId}`);
  }
  async listWorkers(params) {
    return this.client.get(`${this.basePath}/workers`, {
      params
    });
  }
  async startWorker(workerId) {
    return this.client.post(`${this.basePath}/workers/${workerId}/start`);
  }
  async stopWorker(workerId) {
    return this.client.post(`${this.basePath}/workers/${workerId}/stop`);
  }
  async listPops() {
    return this.client.get(`${this.basePath}/pops`);
  }
  async purgeCache(patterns) {
    return this.client.post(`${this.basePath}/cache/purge`, { patterns });
  }
  async getRoutingRules() {
    return this.client.get(`${this.basePath}/routing`);
  }
  async setRoutingRule(rule) {
    return this.client.post(`${this.basePath}/routing`, rule);
  }
  async removeRoutingRule(ruleId) {
    await this.client.delete(`${this.basePath}/routing/${ruleId}`);
  }
  async getLatencyMap() {
    return this.client.get(`${this.basePath}/latency-map`);
  }
};
function createEdgeAPI(client) {
  return new EdgeAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EdgeAPI,
  createEdgeAPI
});
