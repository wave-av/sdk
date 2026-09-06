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

// src/prism.ts
var prism_exports = {};
__export(prism_exports, {
  PrismAPI: () => PrismAPI,
  createPrismAPI: () => createPrismAPI
});
module.exports = __toCommonJS(prism_exports);
var PrismAPI = class {
  client;
  basePath = "/v1/prism";
  constructor(client) {
    this.client = client;
  }
  async createDevice(request) {
    return this.client.post(`${this.basePath}/devices`, request);
  }
  async getDevice(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async updateDevice(deviceId, request) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}`, request);
  }
  async removeDevice(deviceId) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}`);
  }
  async listDevices(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async startDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/start`);
  }
  async stopDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/stop`);
  }
  async getHealth(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/health`);
  }
  async discoverSources(options) {
    return this.client.post(`${this.basePath}/discovery`, options);
  }
  async getPresets(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/presets`);
  }
  async setPreset(deviceId, request) {
    return this.client.put(`${this.basePath}/devices/${deviceId}/presets`, request);
  }
  async removePreset(deviceId, slotNumber) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}`);
  }
  async recallPreset(deviceId, slotNumber) {
    await this.client.post(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}/recall`);
  }
};
function createPrismAPI(client) {
  return new PrismAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PrismAPI,
  createPrismAPI
});
