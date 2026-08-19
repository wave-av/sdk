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

// src/sentiment.ts
var sentiment_exports = {};
__export(sentiment_exports, {
  SentimentAPI: () => SentimentAPI,
  createSentimentAPI: () => createSentimentAPI
});
module.exports = __toCommonJS(sentiment_exports);
var SentimentAPI = class {
  client;
  basePath = "/v1/sentiment";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Analysis Jobs
  // ==========================================================================
  /**
   * Create a sentiment analysis job
   *
   * Requires: sentiment:analyze permission
   */
  async analyze(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Analyze text directly (synchronous for short text)
   *
   * Requires: sentiment:analyze permission
   */
  async analyzeText(text, options) {
    return this.client.post(`${this.basePath}/text`, { text, ...options });
  }
  /**
   * Batch analyze multiple items
   *
   * Requires: sentiment:analyze permission
   */
  async batchAnalyze(request) {
    return this.client.post(`${this.basePath}/batch`, request);
  }
  /**
   * Get an analysis by ID
   *
   * Requires: sentiment:read permission
   */
  async get(analysisId) {
    return this.client.get(`${this.basePath}/${analysisId}`);
  }
  /**
   * Remove an analysis
   *
   * Requires: sentiment:remove permission (server-side RBAC enforced)
   */
  async remove(analysisId) {
    await this.client.delete(
      `${this.basePath}/${analysisId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List analyses
   *
   * Requires: sentiment:read permission
   */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  // ==========================================================================
  // Analysis Results
  // ==========================================================================
  /**
   * Get sentiment segments
   *
   * Requires: sentiment:read permission
   */
  async getSegments(analysisId, params) {
    return this.client.get(
      `${this.basePath}/${analysisId}/segments`,
      { params }
    );
  }
  /**
   * Get sentiment summary
   *
   * Requires: sentiment:read permission
   */
  async getSummary(analysisId) {
    return this.client.get(
      `${this.basePath}/${analysisId}/summary`
    );
  }
  /**
   * Get sentiment trend over time
   *
   * Requires: sentiment:read permission
   */
  async getTrend(analysisId, options) {
    return this.client.get(
      `${this.basePath}/${analysisId}/trend`,
      { params: options }
    );
  }
  /**
   * Get key emotional moments
   *
   * Requires: sentiment:read permission
   */
  async getKeyMoments(analysisId, options) {
    return this.client.get(
      `${this.basePath}/${analysisId}/key-moments`,
      { params: options }
    );
  }
  /**
   * Get topic sentiments
   *
   * Requires: sentiment:read permission
   */
  async getTopicSentiments(analysisId, options) {
    return this.client.get(
      `${this.basePath}/${analysisId}/topics`,
      { params: options }
    );
  }
  // ==========================================================================
  // Speaker Analysis
  // ==========================================================================
  /**
   * Get sentiment by speaker
   *
   * Requires: sentiment:read permission
   */
  async getSpeakerSentiment(analysisId) {
    return this.client.get(`${this.basePath}/${analysisId}/speakers`);
  }
  // ==========================================================================
  // Real-time Analysis
  // ==========================================================================
  /**
   * Start real-time sentiment analysis
   *
   * Requires: sentiment:realtime permission
   */
  async startRealtime(streamId, options) {
    return this.client.post(`${this.basePath}/realtime/start`, {
      stream_id: streamId,
      ...options
    });
  }
  /**
   * Stop real-time analysis
   *
   * Requires: sentiment:realtime permission
   */
  async stopRealtime(sessionId) {
    return this.client.post(
      `${this.basePath}/realtime/${sessionId}/stop`
    );
  }
  /**
   * Get real-time session status
   *
   * Requires: sentiment:read permission
   */
  async getRealtimeStatus(sessionId) {
    return this.client.get(`${this.basePath}/realtime/${sessionId}`);
  }
  // ==========================================================================
  // Comparison
  // ==========================================================================
  /**
   * Compare sentiment between analyses
   *
   * Requires: sentiment:read permission
   */
  async compare(analysisIds) {
    return this.client.post(`${this.basePath}/compare`, {
      analysis_ids: analysisIds
    });
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export analysis results
   *
   * Requires: sentiment:read permission
   */
  async exportAnalysis(analysisId, format) {
    return this.client.post(`${this.basePath}/${analysisId}/export`, { format });
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for analysis to complete
   */
  async waitForReady(analysisId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const analysis = await this.get(analysisId);
      if (options?.onProgress) {
        options.onProgress(analysis);
      }
      if (analysis.status === "ready") {
        return analysis;
      }
      if (analysis.status === "failed") {
        throw new Error(
          `Sentiment analysis failed: ${analysis.error || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Sentiment analysis timed out after ${timeout}ms`);
  }
  /**
   * Get supported languages
   *
   * Requires: sentiment:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
};
function createSentimentAPI(client) {
  return new SentimentAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SentimentAPI,
  createSentimentAPI
});
