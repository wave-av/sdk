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

// src/camera-control.ts
var camera_control_exports = {};
__export(camera_control_exports, {
  CameraControlAPI: () => CameraControlAPI,
  createCameraControlAPI: () => createCameraControlAPI
});
module.exports = __toCommonJS(camera_control_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraControlAPI,
  createCameraControlAPI
});
