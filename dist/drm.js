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

// src/drm.ts
var drm_exports = {};
__export(drm_exports, {
  DrmAPI: () => DrmAPI,
  createDrmAPI: () => createDrmAPI
});
module.exports = __toCommonJS(drm_exports);
var DrmAPI = class {
  client;
  basePath = "/v1/drm";
  constructor(client) {
    this.client = client;
  }
  /** Create a DRM policy. */
  async createPolicy(request) {
    return this.client.post(`${this.basePath}/policies`, request);
  }
  /** Get a DRM policy by ID. */
  async getPolicy(policyId) {
    return this.client.get(`${this.basePath}/policies/${policyId}`);
  }
  /** List DRM policies. */
  async listPolicies(params) {
    return this.client.get(`${this.basePath}/policies`, {
      params
    });
  }
  /** Update a DRM policy. */
  async updatePolicy(policyId, updates) {
    return this.client.patch(`${this.basePath}/policies/${policyId}`, updates);
  }
  /** Delete a DRM policy. */
  async removePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  /** Get a DRM certificate for a provider. */
  async getCertificate(provider) {
    return this.client.get(`${this.basePath}/certificate/${provider}`);
  }
  /** Issue a license for an asset. */
  async issueLicense(assetId, policyId, deviceId) {
    return this.client.post(`${this.basePath}/license`, {
      asset_id: assetId,
      policy_id: policyId,
      device_id: deviceId
    });
  }
  /** Revoke a license. */
  async revokeLicense(licenseId) {
    return this.client.post(`${this.basePath}/license/${licenseId}/revoke`);
  }
  /** List licenses for an asset or user. */
  async listLicenses(params) {
    return this.client.get(`${this.basePath}/licenses`, {
      params
    });
  }
};
function createDrmAPI(client) {
  return new DrmAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DrmAPI,
  createDrmAPI
});
