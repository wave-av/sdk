import "./chunk-Y6FXYEAI.mjs";

// src/camera-control.ts
var CameraControlAPI = class {
  client;
  basePath = "/v1/cameras";
  constructor(client) {
    this.client = client;
  }
  async discover() {
    return this.client.post(`${this.basePath}/discover`, {});
  }
  async list() {
    return this.client.get(this.basePath);
  }
  async get(cameraId) {
    return this.client.get(`${this.basePath}/${cameraId}`);
  }
  async control(cameraId, params) {
    const controlPath = `${this.basePath}/${cameraId}/control`;
    const commands = [];
    if (params.iris !== void 0) {
      commands.push(this.client.post(controlPath, { type: "set_iris", value: params.iris }));
    }
    if (params.focus !== void 0) {
      commands.push(this.client.post(controlPath, { type: "set_focus", value: params.focus }));
    }
    if (params.zoom !== void 0) {
      commands.push(this.client.post(controlPath, { type: "set_zoom", value: params.zoom }));
    }
    if (params.whiteBalance) {
      commands.push(this.client.post(controlPath, {
        type: "set_white_balance",
        temperature: params.whiteBalance.temperature,
        tint: params.whiteBalance.tint
      }));
    }
    if (params.gain !== void 0) {
      commands.push(this.client.post(controlPath, { type: "set_gain", value: params.gain }));
    }
    if (params.panTilt) {
      commands.push(this.client.post(controlPath, { type: "set_pan_tilt", ...params.panTilt }));
    }
    await Promise.all(commands);
  }
  async autofocus(cameraId) {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: "autofocus_trigger" });
  }
  async savePreset(cameraId, name, slot) {
    return this.client.post(`${this.basePath}/${cameraId}/presets`, { name, slot });
  }
  async recallPreset(cameraId, presetId) {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: "recall_preset", presetId });
  }
  async listPresets(cameraId) {
    return this.client.get(`${this.basePath}/${cameraId}/presets`);
  }
  async startRecording(cameraId) {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: "start_recording" });
  }
  async stopRecording(cameraId) {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: "stop_recording" });
  }
};
function createCameraControlAPI(client) {
  return new CameraControlAPI(client);
}
export {
  CameraControlAPI,
  createCameraControlAPI
};
