// src/distribution.ts
var DistributionAPI = class {
  client;
  basePath = "/v1/distribution";
  constructor(client) {
    this.client = client;
  }
  async listDestinations(params) {
    return this.client.get(`${this.basePath}/destinations`, {
      params
    });
  }
  async getDestination(destId) {
    return this.client.get(`${this.basePath}/destinations/${destId}`);
  }
  async addDestination(request) {
    return this.client.post(`${this.basePath}/destinations`, request);
  }
  async updateDestination(destId, updates) {
    return this.client.patch(`${this.basePath}/destinations/${destId}`, updates);
  }
  async removeDestination(destId) {
    await this.client.delete(`${this.basePath}/destinations/${destId}`);
  }
  async startSimulcast(streamId, destinationIds) {
    return this.client.post(`${this.basePath}/simulcast`, {
      stream_id: streamId,
      destination_ids: destinationIds
    });
  }
  async stopSimulcast(streamId) {
    return this.client.post(`${this.basePath}/simulcast/stop`, {
      stream_id: streamId
    });
  }
  async getSimulcastStatus(streamId) {
    return this.client.get(`${this.basePath}/simulcast/${streamId}`);
  }
  async schedulePost(request) {
    return this.client.post(`${this.basePath}/posts`, request);
  }
  async listScheduledPosts(params) {
    return this.client.get(`${this.basePath}/posts`, {
      params
    });
  }
  async cancelScheduledPost(postId) {
    await this.client.delete(`${this.basePath}/posts/${postId}`);
  }
  async getDistributionAnalytics(params) {
    return this.client.get(`${this.basePath}/analytics`, {
      params
    });
  }
};
function createDistributionAPI(client) {
  return new DistributionAPI(client);
}

export {
  DistributionAPI,
  createDistributionAPI
};
