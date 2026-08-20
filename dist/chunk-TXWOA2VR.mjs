// src/marketplace.ts
var MarketplaceAPI = class {
  client;
  basePath = "/v1/marketplace";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async get(itemId) {
    return this.client.get(`${this.basePath}/${itemId}`);
  }
  async install(itemId) {
    return this.client.post(`${this.basePath}/${itemId}/install`);
  }
  async uninstall(itemId) {
    await this.client.delete(`${this.basePath}/${itemId}/install`);
  }
  async listInstalled(params) {
    return this.client.get(`${this.basePath}/installed`, {
      params
    });
  }
  async publish(request) {
    return this.client.post(this.basePath, request);
  }
  async update(itemId, updates) {
    return this.client.patch(`${this.basePath}/${itemId}`, updates);
  }
  async deprecate(itemId) {
    await this.client.post(`${this.basePath}/${itemId}/deprecate`);
  }
  async getReviews(itemId, params) {
    return this.client.get(`${this.basePath}/${itemId}/reviews`, {
      params
    });
  }
  async addReview(itemId, review) {
    return this.client.post(`${this.basePath}/${itemId}/reviews`, review);
  }
  async search(query, params) {
    return this.client.get(`${this.basePath}/search`, {
      params: { q: query, ...params }
    });
  }
};
function createMarketplaceAPI(client) {
  return new MarketplaceAPI(client);
}

export {
  MarketplaceAPI,
  createMarketplaceAPI
};
