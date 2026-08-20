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

// src/zoom.ts
var zoom_exports = {};
__export(zoom_exports, {
  ZoomAPI: () => ZoomAPI,
  createZoomAPI: () => createZoomAPI
});
module.exports = __toCommonJS(zoom_exports);
var ZoomAPI = class {
  client;
  basePath = "/v1/zoom";
  constructor(client) {
    this.client = client;
  }
  async createMeeting(request) {
    return this.client.post(`${this.basePath}/meetings`, request);
  }
  async getMeeting(meetingId) {
    return this.client.get(`${this.basePath}/meetings/${meetingId}`);
  }
  async endMeeting(meetingId) {
    await this.client.post(`${this.basePath}/meetings/${meetingId}/end`);
  }
  async listMeetings(params) {
    return this.client.get(`${this.basePath}/meetings`, {
      params
    });
  }
  async listRooms(params) {
    return this.client.get(`${this.basePath}/rooms`, {
      params
    });
  }
  async getRoomStatus(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}`);
  }
  async getRecording(recordingId) {
    return this.client.get(`${this.basePath}/recordings/${recordingId}`);
  }
  async listRecordings(meetingId, params) {
    const path = meetingId ? `${this.basePath}/meetings/${meetingId}/recordings` : `${this.basePath}/recordings`;
    return this.client.get(path, {
      params
    });
  }
  async startRTMS(meetingId, config) {
    return this.client.post(
      `${this.basePath}/meetings/${meetingId}/rtms/start`,
      config
    );
  }
  async stopRTMS(meetingId) {
    return this.client.post(`${this.basePath}/meetings/${meetingId}/rtms/stop`);
  }
  async getRTMSStatus(meetingId) {
    return this.client.get(
      `${this.basePath}/meetings/${meetingId}/rtms`
    );
  }
};
function createZoomAPI(client) {
  return new ZoomAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZoomAPI,
  createZoomAPI
});
