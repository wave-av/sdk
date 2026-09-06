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

// src/replay.ts
var replay_exports = {};
__export(replay_exports, {
  ReplayAPI: () => ReplayAPI,
  createReplayAPI: () => createReplayAPI
});
module.exports = __toCommonJS(replay_exports);
var ReplayAPI = class {
  client;
  basePath = "/v1/replay";
  constructor(client) {
    this.client = client;
  }
  async createSession(switcherId) {
    return this.client.post(this.basePath, { switcherId });
  }
  async getSession(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}`);
  }
  async markPOI(sessionId, label) {
    return this.client.post(`${this.basePath}/${sessionId}/poi`, { label });
  }
  async listPOIs(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}/poi`);
  }
  async exportClip(sessionId, options) {
    return this.client.post(`${this.basePath}/${sessionId}/clips`, options);
  }
  async getClip(sessionId, clipId) {
    return this.client.get(`${this.basePath}/${sessionId}/clips/${clipId}`);
  }
  async listClips(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}/clips`);
  }
};
function createReplayAPI(client) {
  return new ReplayAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ReplayAPI,
  createReplayAPI
});
