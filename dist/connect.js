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

// src/connect.ts
var connect_exports = {};
__export(connect_exports, {
  ConnectAPI: () => ConnectAPI,
  createConnectAPI: () => createConnectAPI
});
module.exports = __toCommonJS(connect_exports);
var ConnectAPI = class {
  client;
  basePath = "/v1/integrations";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async get(integrationId) {
    return this.client.get(`${this.basePath}/${integrationId}`);
  }
  async enable(request) {
    return this.client.post(this.basePath, request);
  }
  async disable(integrationId) {
    await this.client.post(`${this.basePath}/${integrationId}/disable`);
  }
  async configure(integrationId, config) {
    return this.client.patch(`${this.basePath}/${integrationId}`, { config });
  }
  async testConnection(integrationId) {
    return this.client.post(
      `${this.basePath}/${integrationId}/test`
    );
  }
  async listWebhooks(integrationId) {
    const path = integrationId ? `${this.basePath}/${integrationId}/webhooks` : "/v1/webhooks";
    return this.client.get(path);
  }
  async createWebhook(integrationId, request) {
    return this.client.post(`${this.basePath}/${integrationId}/webhooks`, request);
  }
  async updateWebhook(webhookId, updates) {
    return this.client.patch(`/v1/webhooks/${webhookId}`, updates);
  }
  async removeWebhook(webhookId) {
    await this.client.delete(`/v1/webhooks/${webhookId}`);
  }
  async listDeliveries(webhookId, params) {
    return this.client.get(
      `/v1/webhooks/${webhookId}/deliveries`,
      { params }
    );
  }
  async retryDelivery(deliveryId) {
    return this.client.post(`/v1/webhooks/deliveries/${deliveryId}/retry`);
  }
};
function createConnectAPI(client) {
  return new ConnectAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConnectAPI,
  createConnectAPI
});
