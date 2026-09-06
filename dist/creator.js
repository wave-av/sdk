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

// src/creator.ts
var creator_exports = {};
__export(creator_exports, {
  CreatorAPI: () => CreatorAPI,
  createCreatorAPI: () => createCreatorAPI
});
module.exports = __toCommonJS(creator_exports);
var CreatorAPI = class {
  client;
  basePath = "/v1/creators";
  constructor(client) {
    this.client = client;
  }
  async getProfile(creatorId) {
    return this.client.get(`${this.basePath}/${creatorId}`);
  }
  async updateProfile(creatorId, request) {
    return this.client.patch(`${this.basePath}/${creatorId}`, request);
  }
  async getRevenue(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/revenue`, {
      params
    });
  }
  async listSubscriptions(creatorId, params) {
    return this.client.get(
      `${this.basePath}/${creatorId}/subscriptions`,
      { params }
    );
  }
  async listTips(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/tips`, {
      params
    });
  }
  async createTipJar(creatorId, config) {
    return this.client.post(`${this.basePath}/${creatorId}/tip-jar`, config);
  }
  async listPayouts(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/payouts`, {
      params
    });
  }
  async requestPayout(creatorId, request) {
    return this.client.post(`${this.basePath}/${creatorId}/payouts`, request);
  }
  async getAnalytics(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/analytics`, {
      params
    });
  }
};
function createCreatorAPI(client) {
  return new CreatorAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreatorAPI,
  createCreatorAPI
});
