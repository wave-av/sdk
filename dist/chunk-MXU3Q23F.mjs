// src/edge.ts
var EdgeAPI = class {
  client;
  basePath = "/v1/edge";
  constructor(client) {
    this.client = client;
  }
  async listNodes(params) {
    return this.client.get(`${this.basePath}/nodes`, {
      params
    });
  }
  async getNode(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}`);
  }
  async getNodeMetrics(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/metrics`);
  }
  async deployWorker(request) {
    return this.client.post(`${this.basePath}/workers`, request);
  }
  async getWorker(workerId) {
    return this.client.get(`${this.basePath}/workers/${workerId}`);
  }
  async updateWorker(workerId, config) {
    return this.client.patch(`${this.basePath}/workers/${workerId}`, config);
  }
  async removeWorker(workerId) {
    await this.client.delete(`${this.basePath}/workers/${workerId}`);
  }
  async listWorkers(params) {
    return this.client.get(`${this.basePath}/workers`, {
      params
    });
  }
  async startWorker(workerId) {
    return this.client.post(`${this.basePath}/workers/${workerId}/start`);
  }
  async stopWorker(workerId) {
    return this.client.post(`${this.basePath}/workers/${workerId}/stop`);
  }
  async listPops() {
    return this.client.get(`${this.basePath}/pops`);
  }
  async purgeCache(patterns) {
    return this.client.post(`${this.basePath}/cache/purge`, { patterns });
  }
  async getRoutingRules() {
    return this.client.get(`${this.basePath}/routing`);
  }
  async setRoutingRule(rule) {
    return this.client.post(`${this.basePath}/routing`, rule);
  }
  async removeRoutingRule(ruleId) {
    await this.client.delete(`${this.basePath}/routing/${ruleId}`);
  }
  async getLatencyMap() {
    return this.client.get(`${this.basePath}/latency-map`);
  }
};
function createEdgeAPI(client) {
  return new EdgeAPI(client);
}

export {
  EdgeAPI,
  createEdgeAPI
};
