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

// src/usb.ts
var usb_exports = {};
__export(usb_exports, {
  UsbAPI: () => UsbAPI,
  createUsbAPI: () => createUsbAPI
});
module.exports = __toCommonJS(usb_exports);
var UsbAPI = class {
  client;
  basePath = "/v1/usb";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async get(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async claim(deviceId, request) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/claim`, request);
  }
  async release(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/release`);
  }
  async getCapabilities(deviceId) {
    return this.client.get(
      `${this.basePath}/devices/${deviceId}/capabilities`
    );
  }
  async listByNode(nodeId, params) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/devices`,
      { params }
    );
  }
  async configure(deviceId, config) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}/config`, config);
  }
};
function createUsbAPI(client) {
  return new UsbAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UsbAPI,
  createUsbAPI
});
