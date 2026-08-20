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

// src/podcast.ts
var podcast_exports = {};
__export(podcast_exports, {
  PodcastAPI: () => PodcastAPI,
  createPodcastAPI: () => createPodcastAPI
});
module.exports = __toCommonJS(podcast_exports);
var PodcastAPI = class {
  client;
  basePath = "/v1/podcasts";
  constructor(client) {
    this.client = client;
  }
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  async get(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}`);
  }
  async update(podcastId, updates) {
    return this.client.patch(`${this.basePath}/${podcastId}`, updates);
  }
  async remove(podcastId) {
    await this.client.delete(`${this.basePath}/${podcastId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async createEpisode(request) {
    return this.client.post(`${this.basePath}/${request.podcast_id}/episodes`, request);
  }
  async getEpisode(episodeId) {
    return this.client.get(`/v1/episodes/${episodeId}`);
  }
  async updateEpisode(episodeId, updates) {
    return this.client.patch(`/v1/episodes/${episodeId}`, updates);
  }
  async removeEpisode(episodeId) {
    await this.client.delete(`/v1/episodes/${episodeId}`);
  }
  async publishEpisode(episodeId) {
    return this.client.post(`/v1/episodes/${episodeId}/publish`);
  }
  async listEpisodes(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/episodes`, {
      params
    });
  }
  async getRSSFeed(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/rss`);
  }
  async getAnalytics(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/analytics`, {
      params
    });
  }
  async distribute(podcastId, targets) {
    return this.client.post(`${this.basePath}/${podcastId}/distribute`, {
      targets
    });
  }
  async getDistributionStatus(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/distribution`);
  }
};
function createPodcastAPI(client) {
  return new PodcastAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PodcastAPI,
  createPodcastAPI
});
