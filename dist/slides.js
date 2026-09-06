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

// src/slides.ts
var slides_exports = {};
__export(slides_exports, {
  SlidesAPI: () => SlidesAPI,
  createSlidesAPI: () => createSlidesAPI
});
module.exports = __toCommonJS(slides_exports);
var SlidesAPI = class {
  client;
  basePath = "/v1/slides";
  constructor(client) {
    this.client = client;
  }
  async convert(request) {
    return this.client.post(this.basePath, request);
  }
  async get(conversionId) {
    return this.client.get(`${this.basePath}/${conversionId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async remove(conversionId) {
    await this.client.delete(`${this.basePath}/${conversionId}`);
  }
  async getProgress(conversionId) {
    return this.client.get(
      `${this.basePath}/${conversionId}/progress`
    );
  }
  async addNarration(conversionId, narrations) {
    return this.client.post(`${this.basePath}/${conversionId}/narration`, {
      narrations
    });
  }
  async waitForReady(conversionId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const conversion = await this.get(conversionId);
      if (conversion.status === "ready") return conversion;
      if (conversion.status === "failed")
        throw new Error(`Conversion failed: ${conversion.error || "Unknown"}`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Conversion timed out after ${timeout}ms`);
  }
};
function createSlidesAPI(client) {
  return new SlidesAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlidesAPI,
  createSlidesAPI
});
