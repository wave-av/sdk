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

// src/perception.ts
var perception_exports = {};
__export(perception_exports, {
  PerceptionAPI: () => PerceptionAPI,
  createPerceptionAPI: () => createPerceptionAPI
});
module.exports = __toCommonJS(perception_exports);
var PerceptionAPI = class {
  client;
  basePath = "/v1/perception";
  constructor(client) {
    this.client = client;
  }
  /** Open a perception session over any transport. Returns the receive descriptor + subscription id + meter binding. */
  async subscribe(request) {
    return this.client.post(`${this.basePath}/subscribe`, request);
  }
  /** Close a subscription (idempotent control-plane close ack). `id` is the `psub_…` from {@link subscribe}. */
  async unsubscribe(subscriptionId) {
    await this.client.delete(`${this.basePath}/subscribe/${subscriptionId}`);
  }
  /** The single populated receive URL for a subscription, regardless of transport (convenience for receivers). */
  static receiveUrl(sub) {
    return sub.receive.whep_url ?? sub.receive.srt_url;
  }
};
function createPerceptionAPI(client) {
  return new PerceptionAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PerceptionAPI,
  createPerceptionAPI
});
