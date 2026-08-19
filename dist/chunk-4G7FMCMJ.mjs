// src/audience.ts
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

export {
  AudienceAPI,
  createAudienceAPI
};
