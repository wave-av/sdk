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

// src/desktop.ts
var desktop_exports = {};
__export(desktop_exports, {
  DesktopAPI: () => DesktopAPI,
  createDesktopAPI: () => createDesktopAPI
});
module.exports = __toCommonJS(desktop_exports);
var DesktopAPI = class {
  client;
  basePath = "/v1/desktop";
  constructor(client) {
    this.client = client;
  }
  async getInfo(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}`);
  }
  async getStatus(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/status`
    );
  }
  async listDevices(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/devices`);
  }
  async configure(nodeId, config) {
    return this.client.patch(`${this.basePath}/nodes/${nodeId}/config`, config);
  }
  async getConfig(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/config`);
  }
  async getLogs(nodeId, params) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/logs`, {
      params
    });
  }
  async getPerformance(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/performance`);
  }
  async checkForUpdate(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/updates`
    );
  }
  async installUpdate(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/updates/install`);
  }
  async restart(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/restart`);
  }
};
function createDesktopAPI(client) {
  return new DesktopAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DesktopAPI,
  createDesktopAPI
});
