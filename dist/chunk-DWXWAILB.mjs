// src/usb.ts
var UsbAPI = class {
  client;
  basePath = "/v1/usb";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async get(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async claim(deviceId, request) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/claim`, request);
  }
  async release(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/release`);
  }
  async getCapabilities(deviceId) {
    return this.client.get(
      `${this.basePath}/devices/${deviceId}/capabilities`
    );
  }
  async listByNode(nodeId, params) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/devices`,
      { params }
    );
  }
  async configure(deviceId, config) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}/config`, config);
  }
};
function createUsbAPI(client) {
  return new UsbAPI(client);
}

export {
  UsbAPI,
  createUsbAPI
};
