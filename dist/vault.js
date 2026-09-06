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

// src/vault.ts
var vault_exports = {};
__export(vault_exports, {
  VaultAPI: () => VaultAPI,
  createVaultAPI: () => createVaultAPI
});
module.exports = __toCommonJS(vault_exports);
var VaultAPI = class {
  client;
  basePath = "/v1/vault";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(`${this.basePath}/recordings`, {
      params
    });
  }
  async get(recordingId) {
    return this.client.get(`${this.basePath}/recordings/${recordingId}`);
  }
  async update(recordingId, updates) {
    return this.client.patch(`${this.basePath}/recordings/${recordingId}`, updates);
  }
  async remove(recordingId) {
    await this.client.delete(`${this.basePath}/recordings/${recordingId}`);
  }
  async getStorageUsage() {
    return this.client.get(`${this.basePath}/storage`);
  }
  async createUpload(request) {
    return this.client.post(`${this.basePath}/uploads`, request);
  }
  async completeUpload(uploadId) {
    return this.client.post(`${this.basePath}/uploads/${uploadId}/complete`);
  }
  async startRecording(streamId, options) {
    return this.client.post(`${this.basePath}/recordings`, {
      stream_id: streamId,
      ...options
    });
  }
  async stopRecording(streamId) {
    return this.client.post(`${this.basePath}/recordings/stop`, { stream_id: streamId });
  }
  async transcode(recordingId, request) {
    return this.client.post(
      `${this.basePath}/recordings/${recordingId}/transcode`,
      request
    );
  }
  async getTranscodeJob(jobId) {
    return this.client.get(`${this.basePath}/transcode/${jobId}`);
  }
  async createArchivePolicy(policy) {
    return this.client.post(`${this.basePath}/policies`, policy);
  }
  async listArchivePolicies() {
    return this.client.get(`${this.basePath}/policies`);
  }
  async removeArchivePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  async getDownloadUrl(recordingId) {
    return this.client.get(
      `${this.basePath}/recordings/${recordingId}/download`
    );
  }
};
function createVaultAPI(client) {
  return new VaultAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VaultAPI,
  createVaultAPI
});
