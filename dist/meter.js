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

// src/meter.ts
var meter_exports = {};
__export(meter_exports, {
  MeterAPI: () => MeterAPI,
  createMeterAPI: () => createMeterAPI
});
module.exports = __toCommonJS(meter_exports);
var MeterAPI = class {
  client;
  basePath = "/v1/meter";
  constructor(client) {
    this.client = client;
  }
  /** Fetch ledger rows for the given time window and optional channel filter. */
  async ledger(params) {
    return this.client.get(`${this.basePath}/ledger`, {
      params
    });
  }
  /** Fetch aggregated rollup totals for the given period. */
  async rollup(params) {
    return this.client.get(`${this.basePath}/ledger/rollup`, {
      params
    });
  }
};
function createMeterAPI(client) {
  return new MeterAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MeterAPI,
  createMeterAPI
});
