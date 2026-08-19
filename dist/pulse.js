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

// src/pulse.ts
var pulse_exports = {};
__export(pulse_exports, {
  PulseAPI: () => PulseAPI,
  createPulseAPI: () => createPulseAPI
});
module.exports = __toCommonJS(pulse_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PulseAPI,
  createPulseAPI
});
