// src/qr.ts
var QrAPI = class {
  client;
  basePath = "/v1/qr";
  constructor(client) {
    this.client = client;
  }
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  async get(qrId) {
    return this.client.get(`${this.basePath}/${qrId}`);
  }
  async update(qrId, updates) {
    return this.client.patch(`${this.basePath}/${qrId}`, updates);
  }
  async remove(qrId) {
    await this.client.delete(`${this.basePath}/${qrId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async getAnalytics(qrId, params) {
    return this.client.get(`${this.basePath}/${qrId}/analytics`, {
      params
    });
  }
  async createBatch(items) {
    return this.client.post(`${this.basePath}/batch`, { items });
  }
  async getImage(qrId, format, size) {
    return this.client.get(`${this.basePath}/${qrId}/image`, {
      params: { format, size }
    });
  }
};
function createQrAPI(client) {
  return new QrAPI(client);
}

export {
  QrAPI,
  createQrAPI
};
