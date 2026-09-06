import "./chunk-Y6FXYEAI.mjs";

// src/cloud-switcher.ts
var CloudSwitcherAPI = class {
  client;
  basePath = "/v1/switcher";
  constructor(client) {
    this.client = client;
  }
  async create(options) {
    return this.client.post(this.basePath, options);
  }
  async get(switcherId) {
    return this.client.get(`${this.basePath}/${switcherId}`);
  }
  async list() {
    return this.client.get(this.basePath);
  }
  async remove(switcherId) {
    await this.client.delete(`${this.basePath}/${switcherId}`);
  }
  async addSource(switcherId, options) {
    return this.client.post(`${this.basePath}/${switcherId}/sources`, options);
  }
  async removeSource(switcherId, sourceId) {
    await this.client.delete(`${this.basePath}/${switcherId}/sources/${sourceId}`);
  }
  async switchTo(switcherId, sourceId) {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: "switch", sourceId });
  }
  async transition(switcherId, options) {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: "transition", config: options });
  }
  async addOutput(switcherId, options) {
    return this.client.post(`${this.basePath}/${switcherId}/outputs`, options);
  }
  async startStreaming(switcherId, outputId) {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/start`, {});
  }
  async stopStreaming(switcherId, outputId) {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/stop`, {});
  }
  async startRecording(switcherId) {
    await this.client.post(`${this.basePath}/${switcherId}/record/start`, {});
  }
  async stopRecording(switcherId) {
    await this.client.post(`${this.basePath}/${switcherId}/record/stop`, {});
  }
};
function createCloudSwitcherAPI(client) {
  return new CloudSwitcherAPI(client);
}
export {
  CloudSwitcherAPI,
  createCloudSwitcherAPI
};
