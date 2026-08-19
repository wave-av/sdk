// src/pulse.ts
var PulseAPI = class {
  client;
  basePath = "/v1/analytics";
  constructor(client) {
    this.client = client;
  }
  async getStreamAnalytics(streamId, params) {
    return this.client.get(`${this.basePath}/streams/${streamId}`, {
      params
    });
  }
  async getViewerAnalytics(params) {
    return this.client.get(`${this.basePath}/viewers`, {
      params
    });
  }
  async getQualityMetrics(params) {
    return this.client.get(`${this.basePath}/quality`, {
      params
    });
  }
  async getEngagementMetrics(params) {
    return this.client.get(`${this.basePath}/engagement`, {
      params
    });
  }
  async getRevenueMetrics(params) {
    return this.client.get(`${this.basePath}/revenue`, {
      params
    });
  }
  async getTimeSeries(metric, params) {
    return this.client.get(`${this.basePath}/timeseries/${metric}`, {
      params
    });
  }
  async createReport(request) {
    return this.client.post(`${this.basePath}/reports`, request);
  }
  async getReport(reportId) {
    return this.client.get(`${this.basePath}/reports/${reportId}`);
  }
  async listReports(params) {
    return this.client.get(`${this.basePath}/reports`, {
      params
    });
  }
  async listDashboards(params) {
    return this.client.get(`${this.basePath}/dashboards`, {
      params
    });
  }
  async createDashboard(request) {
    return this.client.post(`${this.basePath}/dashboards`, request);
  }
  async getDashboard(dashboardId) {
    return this.client.get(`${this.basePath}/dashboards/${dashboardId}`);
  }
  async updateDashboard(dashboardId, updates) {
    return this.client.patch(`${this.basePath}/dashboards/${dashboardId}`, updates);
  }
  async removeDashboard(dashboardId) {
    await this.client.delete(`${this.basePath}/dashboards/${dashboardId}`);
  }
};
function createPulseAPI(client) {
  return new PulseAPI(client);
}

export {
  PulseAPI,
  createPulseAPI
};
