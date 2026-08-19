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

// src/cloud-switcher.ts
var cloud_switcher_exports = {};
__export(cloud_switcher_exports, {
  CloudSwitcherAPI: () => CloudSwitcherAPI,
  createCloudSwitcherAPI: () => createCloudSwitcherAPI
});
module.exports = __toCommonJS(cloud_switcher_exports);
var CloudSwitcherAPI = class {
  client;
  basePath = "/v1/switcher";
  constructor(client) {
    this.client = client;
  }
  async create(options) {
    return this.client.post(this.basePath, options);
  }
  async get(switcherId) {
    return this.client.get(`${this.basePath}/${switcherId}`);
  }
  async list() {
    return this.client.get(this.basePath);
  }
  async remove(switcherId) {
    await this.client.delete(`${this.basePath}/${switcherId}`);
  }
  async addSource(switcherId, options) {
    return this.client.post(`${this.basePath}/${switcherId}/sources`, options);
  }
  async removeSource(switcherId, sourceId) {
    await this.client.delete(`${this.basePath}/${switcherId}/sources/${sourceId}`);
  }
  async switchTo(switcherId, sourceId) {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: "switch", sourceId });
  }
  async transition(switcherId, options) {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: "transition", config: options });
  }
  async addOutput(switcherId, options) {
    return this.client.post(`${this.basePath}/${switcherId}/outputs`, options);
  }
  async startStreaming(switcherId, outputId) {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/start`, {});
  }
  async stopStreaming(switcherId, outputId) {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/stop`, {});
  }
  async startRecording(switcherId) {
    await this.client.post(`${this.basePath}/${switcherId}/record/start`, {});
  }
  async stopRecording(switcherId) {
    await this.client.post(`${this.basePath}/${switcherId}/record/stop`, {});
  }
};
function createCloudSwitcherAPI(client) {
  return new CloudSwitcherAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudSwitcherAPI,
  createCloudSwitcherAPI
});
