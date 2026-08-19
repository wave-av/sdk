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

// src/voice.ts
var voice_exports = {};
__export(voice_exports, {
  VoiceAPI: () => VoiceAPI,
  createVoiceAPI: () => createVoiceAPI
});
module.exports = __toCommonJS(voice_exports);
var VoiceAPI = class {
  client;
  basePath = "/v1/voice";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Voices
  // ==========================================================================
  /**
   * List available voices
   *
   * Requires: voice:read permission
   */
  async listVoices(params) {
    const queryParams = {
      ...params,
      tags: params?.tags?.join(",")
    };
    return this.client.get(`${this.basePath}/voices`, {
      params: queryParams
    });
  }
  /**
   * Get a voice by ID
   *
   * Requires: voice:read permission
   */
  async getVoice(voiceId) {
    return this.client.get(`${this.basePath}/voices/${voiceId}`);
  }
  /**
   * Get default voice settings for a voice
   *
   * Requires: voice:read permission
   */
  async getVoiceSettings(voiceId) {
    return this.client.get(
      `${this.basePath}/voices/${voiceId}/settings`
    );
  }
  /**
   * Update voice settings for a cloned voice
   *
   * Requires: voice:update permission
   */
  async updateVoiceSettings(voiceId, settings) {
    return this.client.patch(
      `${this.basePath}/voices/${voiceId}/settings`,
      settings
    );
  }
  /**
   * Remove a cloned voice
   *
   * Requires: voice:remove permission (server-side RBAC enforced)
   */
  async removeVoice(voiceId) {
    await this.client.delete(
      `${this.basePath}/voices/${voiceId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Speech Synthesis
  // ==========================================================================
  /**
   * Synthesize text to speech
   *
   * Requires: voice:synthesize permission
   */
  async synthesize(request) {
    return this.client.post(
      `${this.basePath}/synthesize`,
      request
    );
  }
  /**
   * Get synthesis job status
   *
   * Requires: voice:read permission
   */
  async getSynthesis(synthesisId) {
    return this.client.get(
      `${this.basePath}/synthesize/${synthesisId}`
    );
  }
  /**
   * List synthesis jobs
   *
   * Requires: voice:read permission
   */
  async listSyntheses(params) {
    return this.client.get(
      `${this.basePath}/synthesize`,
      { params }
    );
  }
  /**
   * Synthesize speech and stream the audio
   *
   * Requires: voice:synthesize permission
   *
   * @returns ReadableStream of audio data
   */
  async synthesizeStream(request) {
    const response = await fetch(
      `${this.client["config"].baseUrl}${this.basePath}/synthesize/stream`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.client["config"].apiKey}`,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify(request)
      }
    );
    if (!response.ok) {
      throw new Error(`Synthesis stream failed: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error("No response body");
    }
    return response.body;
  }
  /**
   * Wait for synthesis to complete
   */
  async waitForSynthesis(synthesisId, options) {
    const pollInterval = options?.pollInterval || 1e3;
    const timeout = options?.timeout || 12e4;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const synthesis = await this.getSynthesis(synthesisId);
      if (options?.onProgress) {
        options.onProgress(synthesis);
      }
      if (synthesis.status === "ready") {
        return synthesis;
      }
      if (synthesis.status === "failed") {
        throw new Error(`Synthesis failed: ${synthesis.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Synthesis timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Voice Cloning
  // ==========================================================================
  /**
   * Start voice cloning job
   *
   * Requires: voice:clone permission
   */
  async cloneVoice(request) {
    return this.client.post(
      `${this.basePath}/clone`,
      request
    );
  }
  /**
   * Get voice clone job status
   *
   * Requires: voice:read permission
   */
  async getCloneJob(jobId) {
    return this.client.get(
      `${this.basePath}/clone/${jobId}`
    );
  }
  /**
   * List voice clone jobs
   *
   * Requires: voice:read permission
   */
  async listCloneJobs(params) {
    return this.client.get(
      `${this.basePath}/clone`,
      { params }
    );
  }
  /**
   * Cancel a voice clone job
   *
   * Requires: voice:clone permission
   */
  async cancelCloneJob(jobId) {
    return this.client.post(
      `${this.basePath}/clone/${jobId}/cancel`
    );
  }
  /**
   * Wait for voice cloning to complete
   */
  async waitForClone(jobId, options) {
    const pollInterval = options?.pollInterval || 5e3;
    const timeout = options?.timeout || 36e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const job = await this.getCloneJob(jobId);
      if (options?.onProgress) {
        options.onProgress(job);
      }
      if (job.status === "ready") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(`Voice cloning failed: ${job.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Voice cloning timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Estimate synthesis cost
   *
   * Requires: voice:read permission
   */
  async estimateCost(text, voiceId) {
    return this.client.post(`${this.basePath}/estimate`, {
      text,
      voice_id: voiceId
    });
  }
  /**
   * Get supported languages
   *
   * Requires: voice:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
};
function createVoiceAPI(client) {
  return new VoiceAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VoiceAPI,
  createVoiceAPI
});
