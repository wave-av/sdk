// src/zoom.ts
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

export {
  ZoomAPI,
  createZoomAPI
};
