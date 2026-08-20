// src/desktop.ts
var DesktopAPI = class {
  client;
  basePath = "/v1/desktop";
  constructor(client) {
    this.client = client;
  }
  async getInfo(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}`);
  }
  async getStatus(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/status`
    );
  }
  async listDevices(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/devices`);
  }
  async configure(nodeId, config) {
    return this.client.patch(`${this.basePath}/nodes/${nodeId}/config`, config);
  }
  async getConfig(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/config`);
  }
  async getLogs(nodeId, params) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/logs`, {
      params
    });
  }
  async getPerformance(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/performance`);
  }
  async checkForUpdate(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/updates`
    );
  }
  async installUpdate(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/updates/install`);
  }
  async restart(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/restart`);
  }
};
function createDesktopAPI(client) {
  return new DesktopAPI(client);
}

export {
  DesktopAPI,
  createDesktopAPI
};
