import "./chunk-Y6FXYEAI.mjs";

// src/replay.ts
var ReplayAPI = class {
  client;
  basePath = "/v1/replay";
  constructor(client) {
    this.client = client;
  }
  async createSession(switcherId) {
    return this.client.post(this.basePath, { switcherId });
  }
  async getSession(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}`);
  }
  async markPOI(sessionId, label) {
    return this.client.post(`${this.basePath}/${sessionId}/poi`, { label });
  }
  async listPOIs(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}/poi`);
  }
  async exportClip(sessionId, options) {
    return this.client.post(`${this.basePath}/${sessionId}/clips`, options);
  }
  async getClip(sessionId, clipId) {
    return this.client.get(`${this.basePath}/${sessionId}/clips/${clipId}`);
  }
  async listClips(sessionId) {
    return this.client.get(`${this.basePath}/${sessionId}/clips`);
  }
};
function createReplayAPI(client) {
  return new ReplayAPI(client);
}
export {
  ReplayAPI,
  createReplayAPI
};
