// src/connect.ts
var ConnectAPI = class {
  client;
  basePath = "/v1/integrations";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async get(integrationId) {
    return this.client.get(`${this.basePath}/${integrationId}`);
  }
  async enable(request) {
    return this.client.post(this.basePath, request);
  }
  async disable(integrationId) {
    await this.client.post(`${this.basePath}/${integrationId}/disable`);
  }
  async configure(integrationId, config) {
    return this.client.patch(`${this.basePath}/${integrationId}`, { config });
  }
  async testConnection(integrationId) {
    return this.client.post(
      `${this.basePath}/${integrationId}/test`
    );
  }
  async listWebhooks(integrationId) {
    const path = integrationId ? `${this.basePath}/${integrationId}/webhooks` : "/v1/webhooks";
    return this.client.get(path);
  }
  async createWebhook(integrationId, request) {
    return this.client.post(`${this.basePath}/${integrationId}/webhooks`, request);
  }
  async updateWebhook(webhookId, updates) {
    return this.client.patch(`/v1/webhooks/${webhookId}`, updates);
  }
  async removeWebhook(webhookId) {
    await this.client.delete(`/v1/webhooks/${webhookId}`);
  }
  async listDeliveries(webhookId, params) {
    return this.client.get(
      `/v1/webhooks/${webhookId}/deliveries`,
      { params }
    );
  }
  async retryDelivery(deliveryId) {
    return this.client.post(`/v1/webhooks/deliveries/${deliveryId}/retry`);
  }
};
function createConnectAPI(client) {
  return new ConnectAPI(client);
}

export {
  ConnectAPI,
  createConnectAPI
};
