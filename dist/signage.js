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

// src/signage.ts
var signage_exports = {};
__export(signage_exports, {
  SignageAPI: () => SignageAPI,
  createSignageAPI: () => createSignageAPI
});
module.exports = __toCommonJS(signage_exports);
var SignageAPI = class {
  client;
  basePath = "/v1/signage";
  constructor(client) {
    this.client = client;
  }
  async listDisplays(params) {
    return this.client.get(`${this.basePath}/displays`, {
      params
    });
  }
  async getDisplay(displayId) {
    return this.client.get(`${this.basePath}/displays/${displayId}`);
  }
  async registerDisplay(request) {
    return this.client.post(`${this.basePath}/displays`, request);
  }
  async updateDisplay(displayId, updates) {
    return this.client.patch(`${this.basePath}/displays/${displayId}`, updates);
  }
  async removeDisplay(displayId) {
    await this.client.delete(`${this.basePath}/displays/${displayId}`);
  }
  async createPlaylist(request) {
    return this.client.post(`${this.basePath}/playlists`, request);
  }
  async updatePlaylist(playlistId, updates) {
    return this.client.patch(`${this.basePath}/playlists/${playlistId}`, updates);
  }
  async removePlaylist(playlistId) {
    await this.client.delete(`${this.basePath}/playlists/${playlistId}`);
  }
  async listPlaylists(params) {
    return this.client.get(`${this.basePath}/playlists`, {
      params
    });
  }
  async assignPlaylist(displayId, playlistId) {
    await this.client.post(`${this.basePath}/displays/${displayId}/playlist`, {
      playlist_id: playlistId
    });
  }
  async scheduleContent(request) {
    return this.client.post(`${this.basePath}/schedules`, request);
  }
  async listSchedules(displayId) {
    const path = displayId ? `${this.basePath}/displays/${displayId}/schedules` : `${this.basePath}/schedules`;
    return this.client.get(path);
  }
  async removeSchedule(scheduleId) {
    await this.client.delete(`${this.basePath}/schedules/${scheduleId}`);
  }
  async configureDisplay(displayId, config) {
    return this.client.patch(
      `${this.basePath}/displays/${displayId}/config`,
      config
    );
  }
};
function createSignageAPI(client) {
  return new SignageAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SignageAPI,
  createSignageAPI
});
