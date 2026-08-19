// src/vault.ts
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

export {
  VaultAPI,
  createVaultAPI
};
