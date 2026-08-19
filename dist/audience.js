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

// src/audience.ts
var audience_exports = {};
__export(audience_exports, {
  AudienceAPI: () => AudienceAPI,
  createAudienceAPI: () => createAudienceAPI
});
module.exports = __toCommonJS(audience_exports);
var AudienceAPI = class {
  client;
  basePath = "/v1/audience";
  constructor(client) {
    this.client = client;
  }
  async createPoll(request) {
    return this.client.post(`${this.basePath}/polls`, request);
  }
  async getPoll(pollId) {
    return this.client.get(`${this.basePath}/polls/${pollId}`);
  }
  async closePoll(pollId) {
    return this.client.post(`${this.basePath}/polls/${pollId}/close`);
  }
  async getPollResults(pollId) {
    return this.client.get(`${this.basePath}/polls/${pollId}/results`);
  }
  async vote(pollId, optionIds) {
    await this.client.post(`${this.basePath}/polls/${pollId}/vote`, { option_ids: optionIds });
  }
  async createQA(request) {
    return this.client.post(`${this.basePath}/qa`, request);
  }
  async getQA(sessionId) {
    return this.client.get(`${this.basePath}/qa/${sessionId}`);
  }
  async closeQA(sessionId) {
    return this.client.post(`${this.basePath}/qa/${sessionId}/close`);
  }
  async submitQuestion(sessionId, text) {
    return this.client.post(`${this.basePath}/qa/${sessionId}/questions`, { text });
  }
  async answerQuestion(sessionId, questionId, answer) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/answer`,
      { answer }
    );
  }
  async upvoteQuestion(sessionId, questionId) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/upvote`
    );
  }
  async pinQuestion(sessionId, questionId) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/pin`
    );
  }
  async sendReaction(streamId, type) {
    await this.client.post(`${this.basePath}/reactions`, { stream_id: streamId, type });
  }
  async getReactionMetrics(streamId) {
    return this.client.get(`${this.basePath}/reactions/${streamId}`);
  }
  async getEngagementMetrics(streamId) {
    return this.client.get(`${this.basePath}/engagement/${streamId}`);
  }
};
function createAudienceAPI(client) {
  return new AudienceAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AudienceAPI,
  createAudienceAPI
});
