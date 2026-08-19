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

// src/marketplace.ts
var marketplace_exports = {};
__export(marketplace_exports, {
  MarketplaceAPI: () => MarketplaceAPI,
  createMarketplaceAPI: () => createMarketplaceAPI
});
module.exports = __toCommonJS(marketplace_exports);
var MarketplaceAPI = class {
  client;
  basePath = "/v1/marketplace";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async get(itemId) {
    return this.client.get(`${this.basePath}/${itemId}`);
  }
  async install(itemId) {
    return this.client.post(`${this.basePath}/${itemId}/install`);
  }
  async uninstall(itemId) {
    await this.client.delete(`${this.basePath}/${itemId}/install`);
  }
  async listInstalled(params) {
    return this.client.get(`${this.basePath}/installed`, {
      params
    });
  }
  async publish(request) {
    return this.client.post(this.basePath, request);
  }
  async update(itemId, updates) {
    return this.client.patch(`${this.basePath}/${itemId}`, updates);
  }
  async deprecate(itemId) {
    await this.client.post(`${this.basePath}/${itemId}/deprecate`);
  }
  async getReviews(itemId, params) {
    return this.client.get(`${this.basePath}/${itemId}/reviews`, {
      params
    });
  }
  async addReview(itemId, review) {
    return this.client.post(`${this.basePath}/${itemId}/reviews`, review);
  }
  async search(query, params) {
    return this.client.get(`${this.basePath}/search`, {
      params: { q: query, ...params }
    });
  }
};
function createMarketplaceAPI(client) {
  return new MarketplaceAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MarketplaceAPI,
  createMarketplaceAPI
});
