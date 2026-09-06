// src/prism.ts
var PrismAPI = class {
  client;
  basePath = "/v1/prism";
  constructor(client) {
    this.client = client;
  }
  async createDevice(request) {
    return this.client.post(`${this.basePath}/devices`, request);
  }
  async getDevice(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async updateDevice(deviceId, request) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}`, request);
  }
  async removeDevice(deviceId) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}`);
  }
  async listDevices(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async startDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/start`);
  }
  async stopDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/stop`);
  }
  async getHealth(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/health`);
  }
  async discoverSources(options) {
    return this.client.post(`${this.basePath}/discovery`, options);
  }
  async getPresets(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/presets`);
  }
  async setPreset(deviceId, request) {
    return this.client.put(`${this.basePath}/devices/${deviceId}/presets`, request);
  }
  async removePreset(deviceId, slotNumber) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}`);
  }
  async recallPreset(deviceId, slotNumber) {
    await this.client.post(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}/recall`);
  }
};
function createPrismAPI(client) {
  return new PrismAPI(client);
}

export {
  PrismAPI,
  createPrismAPI
};
