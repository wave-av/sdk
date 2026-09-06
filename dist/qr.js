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

// src/qr.ts
var qr_exports = {};
__export(qr_exports, {
  QrAPI: () => QrAPI,
  createQrAPI: () => createQrAPI
});
module.exports = __toCommonJS(qr_exports);
var QrAPI = class {
  client;
  basePath = "/v1/qr";
  constructor(client) {
    this.client = client;
  }
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  async get(qrId) {
    return this.client.get(`${this.basePath}/${qrId}`);
  }
  async update(qrId, updates) {
    return this.client.patch(`${this.basePath}/${qrId}`, updates);
  }
  async remove(qrId) {
    await this.client.delete(`${this.basePath}/${qrId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async getAnalytics(qrId, params) {
    return this.client.get(`${this.basePath}/${qrId}/analytics`, {
      params
    });
  }
  async createBatch(items) {
    return this.client.post(`${this.basePath}/batch`, { items });
  }
  async getImage(qrId, format, size) {
    return this.client.get(`${this.basePath}/${qrId}/image`, {
      params: { format, size }
    });
  }
};
function createQrAPI(client) {
  return new QrAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QrAPI,
  createQrAPI
});
