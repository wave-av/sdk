// src/creator.ts
var CreatorAPI = class {
  client;
  basePath = "/v1/creators";
  constructor(client) {
    this.client = client;
  }
  async getProfile(creatorId) {
    return this.client.get(`${this.basePath}/${creatorId}`);
  }
  async updateProfile(creatorId, request) {
    return this.client.patch(`${this.basePath}/${creatorId}`, request);
  }
  async getRevenue(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/revenue`, {
      params
    });
  }
  async listSubscriptions(creatorId, params) {
    return this.client.get(
      `${this.basePath}/${creatorId}/subscriptions`,
      { params }
    );
  }
  async listTips(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/tips`, {
      params
    });
  }
  async createTipJar(creatorId, config) {
    return this.client.post(`${this.basePath}/${creatorId}/tip-jar`, config);
  }
  async listPayouts(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/payouts`, {
      params
    });
  }
  async requestPayout(creatorId, request) {
    return this.client.post(`${this.basePath}/${creatorId}/payouts`, request);
  }
  async getAnalytics(creatorId, params) {
    return this.client.get(`${this.basePath}/${creatorId}/analytics`, {
      params
    });
  }
};
function createCreatorAPI(client) {
  return new CreatorAPI(client);
}

export {
  CreatorAPI,
  createCreatorAPI
};
