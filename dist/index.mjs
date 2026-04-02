var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/client.ts
import { EventEmitter } from "eventemitter3";

// src/telemetry.ts
var SPAN_STATUS_OK = 1;
var SPAN_STATUS_ERROR = 2;
var resolvedTracer = null;
var telemetryEnabled = false;
function initTelemetry(config) {
  if (!config.enabled) {
    telemetryEnabled = false;
    resolvedTracer = null;
    return;
  }
  try {
    const otelApi = __require("@opentelemetry/api");
    const serviceName = config.serviceName ?? "@wave/sdk";
    resolvedTracer = otelApi.trace.getTracer(serviceName, "2.0.0");
    telemetryEnabled = true;
  } catch {
    telemetryEnabled = false;
    resolvedTracer = null;
  }
}
function resetTelemetry() {
  telemetryEnabled = false;
  resolvedTracer = null;
}
function isTelemetryEnabled() {
  return telemetryEnabled;
}
async function withTelemetry(operationName, fn, attributes) {
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }
  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();
  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }
    const result = await fn();
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();
    return result;
  } catch (error) {
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError";
    span.setAttribute("wave.sdk.error_type", errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();
    throw error;
  }
}
function withTelemetrySync(operationName, fn, attributes) {
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }
  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();
  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }
    const result = fn();
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();
    return result;
  } catch (error) {
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError";
    span.setAttribute("wave.sdk.error_type", errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();
    throw error;
  }
}

// src/client.ts
var WaveError = class extends Error {
  code;
  statusCode;
  requestId;
  details;
  retryable;
  constructor(message, code, statusCode, requestId, details) {
    super(message);
    this.name = "WaveError";
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.details = details;
    this.retryable = this.isRetryable(statusCode, code);
  }
  isRetryable(statusCode, code) {
    if (statusCode === 429) return true;
    if (statusCode >= 500 && statusCode < 600) return true;
    if (["TIMEOUT", "NETWORK_ERROR", "SERVICE_UNAVAILABLE"].includes(code)) {
      return true;
    }
    return false;
  }
};
var RateLimitError = class extends WaveError {
  retryAfter;
  constructor(message, retryAfter, requestId) {
    super(message, "RATE_LIMITED", 429, requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var WaveClient = class extends EventEmitter {
  config;
  constructor(config) {
    super();
    if (!config.apiKey) {
      throw new Error("WAVE SDK: apiKey is required");
    }
    this.config = {
      apiKey: config.apiKey,
      organizationId: config.organizationId || "",
      baseUrl: config.baseUrl || "https://api.wave.online",
      timeout: config.timeout || 3e4,
      maxRetries: config.maxRetries ?? 3,
      debug: config.debug || false,
      customHeaders: config.customHeaders || {},
      telemetry: config.telemetry
    };
    if (config.telemetry) {
      initTelemetry(config.telemetry);
    }
  }
  // ==========================================================================
  // HTTP Methods
  // ==========================================================================
  /**
   * Make a GET request
   */
  async get(path, options) {
    return this.request(path, { ...options, method: "GET" });
  }
  /**
   * Make a POST request
   */
  async post(path, body, options) {
    return this.request(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a PUT request
   */
  async put(path, body, options) {
    return this.request(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a PATCH request
   */
  async patch(path, body, options) {
    return this.request(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a DELETE request
   */
  async delete(path, options) {
    return this.request(path, { ...options, method: "DELETE" });
  }
  // ==========================================================================
  // Core Request Logic
  // ==========================================================================
  /**
   * Make an API request with retry logic
   */
  async request(path, options = {}) {
    const { params, noRetry, timeout: requestTimeout, ...fetchOptions } = options;
    let url = `${this.config.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0) {
          searchParams.set(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.executeWithRetry(
      url,
      {
        ...fetchOptions,
        headers: this.buildHeaders(fetchOptions.headers)
      },
      noRetry ? 0 : this.config.maxRetries,
      requestTimeout || this.config.timeout
    );
  }
  /**
   * Execute request with exponential backoff retry
   */
  async executeWithRetry(url, options, maxRetries, timeout) {
    const method = options.method || "GET";
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.emit("request.start", url, method);
        const startTime = Date.now();
        const response = await this.fetchWithTimeout(url, options, timeout);
        const duration = Date.now() - startTime;
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response);
          this.emit("rate_limit.hit", retryAfter);
          if (attempt < maxRetries) {
            this.emit("request.retry", url, method, attempt + 1, retryAfter);
            await this.sleep(retryAfter);
            continue;
          }
          throw new RateLimitError(
            "Rate limit exceeded",
            retryAfter,
            response.headers.get("x-request-id") || void 0
          );
        }
        if (!response.ok) {
          const error = await this.parseErrorResponse(response);
          if (error.retryable && attempt < maxRetries) {
            const delay = this.calculateBackoff(attempt);
            this.emit("request.retry", url, method, attempt + 1, delay);
            await this.sleep(delay);
            continue;
          }
          throw error;
        }
        this.emit("request.success", url, method, duration);
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return response.json();
        }
        return {};
      } catch (error) {
        lastError = error;
        if (error instanceof WaveError && !error.retryable) {
          throw error;
        }
        if (error instanceof TypeError || error instanceof Error && error.name === "AbortError") {
          if (attempt < maxRetries) {
            const delay = this.calculateBackoff(attempt);
            this.emit("request.retry", url, method, attempt + 1, delay);
            await this.sleep(delay);
            continue;
          }
        }
        this.emit("request.error", url, method, error);
      }
    }
    throw lastError || new WaveError("Request failed after retries", "UNKNOWN_ERROR", 0);
  }
  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Build request headers
   */
  buildHeaders(additionalHeaders) {
    const headers = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": `wave-sdk-typescript/1.0.0`,
      ...this.config.customHeaders
    };
    if (this.config.organizationId) {
      headers["X-Organization-Id"] = this.config.organizationId;
    }
    if (additionalHeaders) {
      if (additionalHeaders instanceof Headers) {
        additionalHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(additionalHeaders)) {
        additionalHeaders.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, additionalHeaders);
      }
    }
    return headers;
  }
  /**
   * Parse error response
   */
  async parseErrorResponse(response) {
    const requestId = response.headers.get("x-request-id") || void 0;
    try {
      const body = await response.json();
      return new WaveError(
        body.error?.message || `HTTP ${response.status}`,
        body.error?.code || `HTTP_${response.status}`,
        response.status,
        requestId || body.request_id,
        body.error?.details
      );
    } catch {
      return new WaveError(
        `HTTP ${response.status}: ${response.statusText}`,
        `HTTP_${response.status}`,
        response.status,
        requestId
      );
    }
  }
  /**
   * Parse Retry-After header
   */
  parseRetryAfter(response) {
    const retryAfter = response.headers.get("retry-after");
    if (!retryAfter) return 1e3;
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1e3;
    }
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      return Math.max(0, date.getTime() - Date.now());
    }
    return 1e3;
  }
  /**
   * Calculate exponential backoff delay
   */
  calculateBackoff(attempt) {
    const baseDelay = 1e3;
    const maxDelay = 3e4;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * delay * 0.25;
  }
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // ==========================================================================
  // Debugging
  // ==========================================================================
  /**
   * Log debug message
   */
  log(message, ...args) {
    if (this.config.debug) {
      console.log(`[WaveSDK] ${message}`, ...args);
    }
  }
};
function createClient(config) {
  return new WaveClient(config);
}

// src/clips.ts
var ClipsAPI = class {
  client;
  basePath = "/v1/clips";
  constructor(client) {
    this.client = client;
  }
  /**
   * Create a new clip
   *
   * Requires: clips:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a clip by ID
   *
   * Requires: clips:read permission
   */
  async get(clipId) {
    return this.client.get(`${this.basePath}/${clipId}`);
  }
  /**
   * Update a clip
   *
   * Requires: clips:update permission
   */
  async update(clipId, request) {
    return this.client.patch(`${this.basePath}/${clipId}`, request);
  }
  /**
   * Remove a clip
   *
   * Requires: clips:remove permission (server-side RBAC enforced)
   */
  async remove(clipId) {
    await this.client.delete(`${this.basePath}/${clipId}`);
  }
  /**
   * List clips with optional filters
   *
   * Requires: clips:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      source_type: params?.source_type,
      source_id: params?.source_id,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    if (params?.tags?.length) {
      queryParams["tags"] = params.tags.join(",");
    }
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  /**
   * Export a clip to a different format
   *
   * Requires: clips:export permission
   */
  async exportClip(clipId, request) {
    return this.client.post(
      `${this.basePath}/${clipId}/export`,
      request
    );
  }
  /**
   * Get export job status
   *
   * Requires: clips:read permission
   */
  async getExport(clipId, exportId) {
    return this.client.get(
      `${this.basePath}/${clipId}/exports/${exportId}`
    );
  }
  /**
   * List all exports for a clip
   *
   * Requires: clips:read permission
   */
  async listExports(clipId, params) {
    return this.client.get(
      `${this.basePath}/${clipId}/exports`,
      { params }
    );
  }
  /**
   * Detect highlights in source content
   *
   * Requires: clips:analyze permission
   */
  async detectHighlights(sourceType, sourceId, options) {
    return this.client.post(
      `${this.basePath}/highlights/detect`,
      {
        source_type: sourceType,
        source_id: sourceId,
        ...options
      }
    );
  }
  /**
   * Generate clips from detected highlights
   *
   * Requires: clips:create permission
   */
  async createFromHighlights(sourceType, sourceId, options) {
    return this.client.post(`${this.basePath}/highlights/create`, {
      source_type: sourceType,
      source_id: sourceId,
      ...options
    });
  }
  /**
   * Wait for a clip to be ready
   */
  async waitForReady(clipId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 3e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const clip = await this.get(clipId);
      if (options?.onProgress) {
        options.onProgress(clip);
      }
      if (clip.status === "ready") {
        return clip;
      }
      if (clip.status === "failed") {
        throw new Error(`Clip processing failed: ${clip.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Clip processing timed out after ${timeout}ms`);
  }
  /**
   * Wait for an export to be ready
   */
  async waitForExport(clipId, exportId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 3e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const exportJob = await this.getExport(clipId, exportId);
      if (exportJob.status === "ready") {
        return exportJob;
      }
      if (exportJob.status === "failed") {
        throw new Error(`Export failed: ${exportJob.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Export timed out after ${timeout}ms`);
  }
};
function createClipsAPI(client) {
  return new ClipsAPI(client);
}

// src/editor.ts
var EditorAPI = class {
  client;
  basePath = "/v1/editor/projects";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Projects
  // ==========================================================================
  /**
   * Create a new editor project
   *
   * Requires: editor:create permission
   */
  async createProject(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a project by ID
   *
   * Requires: editor:read permission
   */
  async getProject(projectId) {
    return this.client.get(`${this.basePath}/${projectId}`);
  }
  /**
   * Update a project
   *
   * Requires: editor:update permission
   */
  async updateProject(projectId, request) {
    return this.client.patch(`${this.basePath}/${projectId}`, request);
  }
  /**
   * Remove a project
   *
   * Requires: editor:remove permission (server-side RBAC enforced)
   */
  async removeProject(projectId) {
    await this.client.delete(`${this.basePath}/${projectId}`);
  }
  /**
   * List projects
   *
   * Requires: editor:read permission
   */
  async listProjects(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /**
   * Duplicate a project
   *
   * Requires: editor:create permission
   */
  async duplicateProject(projectId, name) {
    return this.client.post(`${this.basePath}/${projectId}/duplicate`, {
      name
    });
  }
  // ==========================================================================
  // Tracks
  // ==========================================================================
  /**
   * Add a track to a project
   *
   * Requires: editor:update permission
   */
  async addTrack(projectId, track) {
    return this.client.post(`${this.basePath}/${projectId}/tracks`, track);
  }
  /**
   * Update a track
   *
   * Requires: editor:update permission
   */
  async updateTrack(projectId, trackId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      updates
    );
  }
  /**
   * Remove a track
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTrack(projectId, trackId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/tracks/${trackId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Elements
  // ==========================================================================
  /**
   * Add an element to a track
   *
   * Requires: editor:update permission
   */
  async addElement(projectId, element) {
    return this.client.post(
      `${this.basePath}/${projectId}/elements`,
      element
    );
  }
  /**
   * Update an element
   *
   * Requires: editor:update permission
   */
  async updateElement(projectId, elementId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      updates
    );
  }
  /**
   * Remove an element
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeElement(projectId, elementId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/elements/${elementId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Move an element to a different position
   *
   * Requires: editor:update permission
   */
  async moveElement(projectId, elementId, options) {
    return this.client.post(
      `${this.basePath}/${projectId}/elements/${elementId}/move`,
      options
    );
  }
  /**
   * Trim an element
   *
   * Requires: editor:update permission
   */
  async trimElement(projectId, elementId, options) {
    return this.client.post(
      `${this.basePath}/${projectId}/elements/${elementId}/trim`,
      options
    );
  }
  // ==========================================================================
  // Transitions
  // ==========================================================================
  /**
   * Add a transition between elements
   *
   * Requires: editor:update permission
   */
  async addTransition(projectId, transition) {
    return this.client.post(
      `${this.basePath}/${projectId}/transitions`,
      transition
    );
  }
  /**
   * Update a transition
   *
   * Requires: editor:update permission
   */
  async updateTransition(projectId, transitionId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      updates
    );
  }
  /**
   * Remove a transition
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeTransition(projectId, transitionId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/transitions/${transitionId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Effects
  // ==========================================================================
  /**
   * Add an effect to an element
   *
   * Requires: editor:update permission
   */
  async addEffect(projectId, effect) {
    return this.client.post(
      `${this.basePath}/${projectId}/effects`,
      effect
    );
  }
  /**
   * Update an effect
   *
   * Requires: editor:update permission
   */
  async updateEffect(projectId, effectId, updates) {
    return this.client.patch(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      updates
    );
  }
  /**
   * Remove an effect
   *
   * Requires: editor:update permission (server-side RBAC enforced)
   */
  async removeEffect(projectId, effectId) {
    await this.client.delete(
      `${this.basePath}/${projectId}/effects/${effectId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Rendering
  // ==========================================================================
  /**
   * Start rendering a project
   *
   * Requires: editor:render permission
   */
  async render(projectId, options) {
    return this.client.post(
      `${this.basePath}/${projectId}/render`,
      options
    );
  }
  /**
   * Get render job status
   *
   * Requires: editor:read permission
   */
  async getRenderJob(projectId, jobId) {
    return this.client.get(
      `${this.basePath}/${projectId}/render/${jobId}`
    );
  }
  /**
   * List render jobs for a project
   *
   * Requires: editor:read permission
   */
  async listRenderJobs(projectId, params) {
    return this.client.get(
      `${this.basePath}/${projectId}/render`,
      { params }
    );
  }
  /**
   * Cancel a render job
   *
   * Requires: editor:render permission
   */
  async cancelRenderJob(projectId, jobId) {
    return this.client.post(
      `${this.basePath}/${projectId}/render/${jobId}/cancel`
    );
  }
  /**
   * Wait for render to complete
   */
  async waitForRender(projectId, jobId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const job = await this.getRenderJob(projectId, jobId);
      if (options?.onProgress) {
        options.onProgress(job);
      }
      if (job.status === "ready") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(`Render failed: ${job.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Render timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Preview
  // ==========================================================================
  /**
   * Generate a preview frame
   *
   * Requires: editor:read permission
   */
  async getPreviewFrame(projectId, time, options) {
    return this.client.get(`${this.basePath}/${projectId}/preview`, {
      params: { time, ...options }
    });
  }
  /**
   * Generate a preview video segment
   *
   * Requires: editor:read permission
   */
  async getPreviewSegment(projectId, startTime, endTime, options) {
    return this.client.post(`${this.basePath}/${projectId}/preview/segment`, {
      start_time: startTime,
      end_time: endTime,
      ...options
    });
  }
};
function createEditorAPI(client) {
  return new EditorAPI(client);
}

// src/voice.ts
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

// src/phone.ts
var PhoneAPI = class {
  client;
  basePath = "/v1/phone";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Phone Numbers
  // ==========================================================================
  /**
   * List owned phone numbers
   *
   * Requires: phone:read permission
   */
  async listNumbers(params) {
    return this.client.get(
      `${this.basePath}/numbers`,
      { params }
    );
  }
  /**
   * Get a phone number by ID
   *
   * Requires: phone:read permission
   */
  async getNumber(numberId) {
    return this.client.get(`${this.basePath}/numbers/${numberId}`);
  }
  /**
   * Search for available phone numbers to purchase
   *
   * Requires: phone:read permission
   */
  async searchAvailableNumbers(request) {
    return this.client.post(
      `${this.basePath}/numbers/available`,
      request
    );
  }
  /**
   * Purchase a phone number
   *
   * Requires: phone:purchase permission
   */
  async purchaseNumber(number, options) {
    return this.client.post(`${this.basePath}/numbers/purchase`, {
      number,
      ...options
    });
  }
  /**
   * Update a phone number
   *
   * Requires: phone:update permission
   */
  async updateNumber(numberId, updates) {
    return this.client.patch(
      `${this.basePath}/numbers/${numberId}`,
      updates
    );
  }
  /**
   * Release a phone number
   *
   * Requires: phone:release permission (server-side RBAC enforced)
   */
  async releaseNumber(numberId) {
    await this.client.delete(
      `${this.basePath}/numbers/${numberId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Calls
  // ==========================================================================
  /**
   * Make an outbound call
   *
   * Requires: phone:call permission
   */
  async makeCall(request) {
    return this.client.post(`${this.basePath}/calls`, request);
  }
  /**
   * Get a call by ID
   *
   * Requires: phone:read permission
   */
  async getCall(callId) {
    return this.client.get(`${this.basePath}/calls/${callId}`);
  }
  /**
   * List calls
   *
   * Requires: phone:read permission
   */
  async listCalls(params) {
    return this.client.get(
      `${this.basePath}/calls`,
      { params }
    );
  }
  /**
   * Update an active call
   *
   * Requires: phone:call permission
   */
  async updateCall(callId, updates) {
    return this.client.patch(`${this.basePath}/calls/${callId}`, updates);
  }
  /**
   * End an active call
   *
   * Requires: phone:call permission
   */
  async endCall(callId) {
    return this.updateCall(callId, { status: "completed" });
  }
  /**
   * Get call recording
   *
   * Requires: phone:read permission
   */
  async getRecording(callId) {
    return this.client.get(`${this.basePath}/calls/${callId}/recording`);
  }
  /**
   * Wait for call to end
   */
  async waitForCallEnd(callId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 36e5;
    const startTime = Date.now();
    const terminalStatuses = [
      "completed",
      "failed",
      "busy",
      "no_answer",
      "canceled"
    ];
    while (Date.now() - startTime < timeout) {
      const call = await this.getCall(callId);
      if (options?.onUpdate) {
        options.onUpdate(call);
      }
      if (terminalStatuses.includes(call.status)) {
        return call;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Call wait timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Conferences
  // ==========================================================================
  /**
   * Create a conference room
   *
   * Requires: phone:conference permission
   */
  async createConference(options) {
    return this.client.post(`${this.basePath}/conferences`, options);
  }
  /**
   * Get a conference by ID
   *
   * Requires: phone:read permission
   */
  async getConference(conferenceId) {
    return this.client.get(
      `${this.basePath}/conferences/${conferenceId}`
    );
  }
  /**
   * List conferences
   *
   * Requires: phone:read permission
   */
  async listConferences(params) {
    return this.client.get(
      `${this.basePath}/conferences`,
      { params }
    );
  }
  /**
   * Add a participant to a conference
   *
   * Requires: phone:conference permission
   */
  async addConferenceParticipant(conferenceId, options) {
    return this.client.post(
      `${this.basePath}/conferences/${conferenceId}/participants`,
      options
    );
  }
  /**
   * Update a conference participant
   *
   * Requires: phone:conference permission
   */
  async updateConferenceParticipant(conferenceId, callId, updates) {
    return this.client.patch(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      updates
    );
  }
  /**
   * Remove a participant from a conference
   *
   * Requires: phone:conference permission (server-side RBAC enforced)
   */
  async removeConferenceParticipant(conferenceId, callId) {
    await this.client.delete(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      { method: "DELETE" }
    );
  }
  /**
   * End a conference
   *
   * Requires: phone:conference permission
   */
  async endConference(conferenceId) {
    return this.client.post(
      `${this.basePath}/conferences/${conferenceId}/end`
    );
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Validate a phone number
   *
   * Requires: phone:read permission
   */
  async validateNumber(number) {
    return this.client.post(`${this.basePath}/validate`, { number });
  }
  /**
   * Get supported countries
   *
   * Requires: phone:read permission
   */
  async getSupportedCountries() {
    return this.client.get(`${this.basePath}/countries`);
  }
};
function createPhoneAPI(client) {
  return new PhoneAPI(client);
}

// src/collab.ts
var CollabAPI = class {
  client;
  basePath = "/v1/collab";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Rooms
  // ==========================================================================
  /**
   * Create a collaboration room
   *
   * Requires: collab:create permission
   */
  async createRoom(request) {
    return this.client.post(`${this.basePath}/rooms`, request);
  }
  /**
   * Get a room by ID
   *
   * Requires: collab:read permission
   */
  async getRoom(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}`);
  }
  /**
   * Update a room
   *
   * Requires: collab:update permission
   */
  async updateRoom(roomId, request) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}`,
      request
    );
  }
  /**
   * Close a room
   *
   * Requires: collab:manage permission
   */
  async closeRoom(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/close`);
  }
  /**
   * Archive a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async archiveRoom(roomId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List rooms
   *
   * Requires: collab:read permission
   */
  async listRooms(params) {
    return this.client.get(
      `${this.basePath}/rooms`,
      { params }
    );
  }
  /**
   * Get join token for real-time connection
   *
   * Requires: collab:join permission
   */
  async getJoinToken(roomId, options) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/token`, options);
  }
  // ==========================================================================
  // Participants
  // ==========================================================================
  /**
   * List participants in a room
   *
   * Requires: collab:read permission
   */
  async listParticipants(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/participants`,
      { params }
    );
  }
  /**
   * Get a participant
   *
   * Requires: collab:read permission
   */
  async getParticipant(roomId, participantId) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`
    );
  }
  /**
   * Update a participant's role
   *
   * Requires: collab:manage permission
   */
  async updateParticipant(roomId, participantId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      updates
    );
  }
  /**
   * Remove a participant from a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async removeParticipant(roomId, participantId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Invite users to a room
   *
   * Requires: collab:invite permission
   */
  async invite(roomId, invites) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/invite`, { invites });
  }
  // ==========================================================================
  // Comments
  // ==========================================================================
  /**
   * Add a comment
   *
   * Requires: collab:comment permission
   */
  async addComment(roomId, comment) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/comments`,
      comment
    );
  }
  /**
   * List comments
   *
   * Requires: collab:read permission
   */
  async listComments(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/comments`,
      { params }
    );
  }
  /**
   * Update a comment
   *
   * Requires: collab:comment permission (own comments) or collab:manage
   */
  async updateComment(roomId, commentId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      updates
    );
  }
  /**
   * Remove a comment
   *
   * Requires: collab:comment permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeComment(roomId, commentId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Add a reaction to a comment
   *
   * Requires: collab:comment permission
   */
  async addReaction(roomId, commentId, emoji) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { emoji }
    );
  }
  /**
   * Remove a reaction from a comment
   *
   * Requires: collab:comment permission (server-side RBAC enforced)
   */
  async removeReaction(roomId, commentId, emoji) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { method: "DELETE", params: { emoji } }
    );
  }
  // ==========================================================================
  // Annotations
  // ==========================================================================
  /**
   * Add an annotation
   *
   * Requires: collab:annotate permission
   */
  async addAnnotation(roomId, annotation) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/annotations`,
      annotation
    );
  }
  /**
   * List annotations
   *
   * Requires: collab:read permission
   */
  async listAnnotations(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/annotations`,
      { params }
    );
  }
  /**
   * Update an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage
   */
  async updateAnnotation(roomId, annotationId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      updates
    );
  }
  /**
   * Remove an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeAnnotation(roomId, annotationId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Clear all annotations
   *
   * Requires: collab:manage permission
   */
  async clearAnnotations(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/annotations/clear`);
  }
  // ==========================================================================
  // Recording
  // ==========================================================================
  /**
   * Start recording the collaboration session
   *
   * Requires: collab:record permission
   */
  async startRecording(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/start`);
  }
  /**
   * Stop recording
   *
   * Requires: collab:record permission
   */
  async stopRecording(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/stop`);
  }
  /**
   * Get recording status
   *
   * Requires: collab:read permission
   */
  async getRecordingStatus(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}/recording`);
  }
};
function createCollabAPI(client) {
  return new CollabAPI(client);
}

// src/captions.ts
var CaptionsAPI = class {
  client;
  basePath = "/v1/captions";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Caption Tracks
  // ==========================================================================
  /**
   * Generate captions using AI
   *
   * Requires: captions:generate permission
   */
  async generate(request) {
    return this.client.post(`${this.basePath}/generate`, request);
  }
  /**
   * Upload existing captions
   *
   * Requires: captions:create permission
   */
  async upload(request) {
    return this.client.post(`${this.basePath}/upload`, request);
  }
  /**
   * Get a caption track by ID
   *
   * Requires: captions:read permission
   */
  async get(trackId) {
    return this.client.get(`${this.basePath}/${trackId}`);
  }
  /**
   * Update a caption track
   *
   * Requires: captions:update permission
   */
  async update(trackId, request) {
    return this.client.patch(`${this.basePath}/${trackId}`, request);
  }
  /**
   * Remove a caption track
   *
   * Requires: captions:remove permission (server-side RBAC enforced)
   */
  async remove(trackId) {
    await this.client.delete(
      `${this.basePath}/${trackId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List caption tracks
   *
   * Requires: captions:read permission
   */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /**
   * Get caption tracks for a specific media
   *
   * Requires: captions:read permission
   */
  async getForMedia(mediaId, mediaType) {
    const result = await this.list({ media_id: mediaId, media_type: mediaType });
    return result.data;
  }
  // ==========================================================================
  // Caption Cues
  // ==========================================================================
  /**
   * Get caption cues (segments)
   *
   * Requires: captions:read permission
   */
  async getCues(trackId, params) {
    return this.client.get(
      `${this.basePath}/${trackId}/cues`,
      { params }
    );
  }
  /**
   * Update a caption cue
   *
   * Requires: captions:update permission
   */
  async updateCue(trackId, cueId, updates) {
    return this.client.patch(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      updates
    );
  }
  /**
   * Add a new caption cue
   *
   * Requires: captions:update permission
   */
  async addCue(trackId, cue) {
    return this.client.post(
      `${this.basePath}/${trackId}/cues`,
      cue
    );
  }
  /**
   * Remove a caption cue
   *
   * Requires: captions:update permission (server-side RBAC enforced)
   */
  async removeCue(trackId, cueId) {
    await this.client.delete(
      `${this.basePath}/${trackId}/cues/${cueId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Bulk update cues
   *
   * Requires: captions:update permission
   */
  async bulkUpdateCues(trackId, updates) {
    return this.client.post(`${this.basePath}/${trackId}/cues/bulk`, { updates });
  }
  // ==========================================================================
  // Translation
  // ==========================================================================
  /**
   * Translate a caption track to another language
   *
   * Requires: captions:translate permission
   */
  async translate(trackId, request) {
    return this.client.post(
      `${this.basePath}/${trackId}/translate`,
      request
    );
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export captions in a specific format
   *
   * Requires: captions:read permission
   */
  async exportFormat(trackId, format) {
    return this.client.get(`${this.basePath}/${trackId}/export`, {
      params: { format }
    });
  }
  /**
   * Get captions as plain text
   *
   * Requires: captions:read permission
   */
  async getText(trackId) {
    const result = await this.client.get(
      `${this.basePath}/${trackId}/text`
    );
    return result.text;
  }
  // ==========================================================================
  // Burn-In
  // ==========================================================================
  /**
   * Burn captions into video
   *
   * Requires: captions:burnin permission
   */
  async burnIn(request) {
    return this.client.post(`${this.basePath}/burn-in`, request);
  }
  /**
   * Get burn-in job status
   *
   * Requires: captions:read permission
   */
  async getBurnInJob(jobId) {
    return this.client.get(`${this.basePath}/burn-in/${jobId}`);
  }
  /**
   * Wait for burn-in to complete
   */
  async waitForBurnIn(jobId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const job = await this.getBurnInJob(jobId);
      if (options?.onProgress) {
        options.onProgress(job);
      }
      if (job.status === "ready") {
        return job;
      }
      if (job.status === "failed") {
        throw new Error(`Burn-in failed: ${job.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Burn-in timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for caption generation to complete
   */
  async waitForReady(trackId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const track = await this.get(trackId);
      if (options?.onProgress) {
        options.onProgress(track);
      }
      if (track.status === "ready") {
        return track;
      }
      if (track.status === "failed") {
        throw new Error(`Caption generation failed: ${track.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Caption generation timed out after ${timeout}ms`);
  }
  /**
   * Get supported languages
   *
   * Requires: captions:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
  /**
   * Detect language from audio
   *
   * Requires: captions:generate permission
   */
  async detectLanguage(mediaId, mediaType) {
    return this.client.post(`${this.basePath}/detect-language`, {
      media_id: mediaId,
      media_type: mediaType
    });
  }
};
function createCaptionsAPI(client) {
  return new CaptionsAPI(client);
}

// src/chapters.ts
var ChaptersAPI = class {
  client;
  basePath = "/v1/chapters";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Chapter Sets
  // ==========================================================================
  /**
   * Generate chapters using AI
   *
   * Requires: chapters:generate permission
   */
  async generate(request) {
    return this.client.post(`${this.basePath}/generate`, request);
  }
  /**
   * Create a chapter set manually
   *
   * Requires: chapters:create permission
   */
  async createSet(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a chapter set by ID
   *
   * Requires: chapters:read permission
   */
  async getSet(setId) {
    return this.client.get(`${this.basePath}/${setId}`);
  }
  /**
   * Update a chapter set
   *
   * Requires: chapters:update permission
   */
  async updateSet(setId, request) {
    return this.client.patch(`${this.basePath}/${setId}`, request);
  }
  /**
   * Remove a chapter set
   *
   * Requires: chapters:remove permission (canDelete verified server-side)
   */
  async removeSet(setId) {
    await this.client.delete(`${this.basePath}/${setId}`);
  }
  /**
   * List chapter sets
   *
   * Requires: chapters:read permission
   */
  async listSets(params) {
    return this.client.get(this.basePath, { params });
  }
  /**
   * Get the default chapter set for a media
   *
   * Requires: chapters:read permission
   */
  async getDefaultSet(mediaId, mediaType) {
    try {
      return await this.client.get(`${this.basePath}/default`, {
        params: { media_id: mediaId, media_type: mediaType }
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  /**
   * Duplicate a chapter set
   *
   * Requires: chapters:create permission
   */
  async duplicateSet(setId, name) {
    return this.client.post(`${this.basePath}/${setId}/duplicate`, { name });
  }
  // ==========================================================================
  // Individual Chapters
  // ==========================================================================
  /**
   * Add a chapter to a set
   *
   * Requires: chapters:update permission
   */
  async addChapter(setId, chapter) {
    return this.client.post(`${this.basePath}/${setId}/chapters`, chapter);
  }
  /**
   * Get a chapter by ID
   *
   * Requires: chapters:read permission
   */
  async getChapter(setId, chapterId) {
    return this.client.get(`${this.basePath}/${setId}/chapters/${chapterId}`);
  }
  /**
   * Update a chapter
   *
   * Requires: chapters:update permission
   */
  async updateChapter(setId, chapterId, request) {
    return this.client.patch(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      request
    );
  }
  /**
   * Remove a chapter
   *
   * Requires: chapters:update permission (server-side RBAC enforced)
   */
  async removeChapter(setId, chapterId) {
    await this.client.delete(
      `${this.basePath}/${setId}/chapters/${chapterId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Reorder chapters
   *
   * Requires: chapters:update permission
   */
  async reorderChapters(setId, chapterIds) {
    return this.client.post(
      `${this.basePath}/${setId}/chapters/reorder`,
      { chapter_ids: chapterIds }
    );
  }
  /**
   * Bulk update chapters
   *
   * Requires: chapters:update permission
   */
  async bulkUpdateChapters(setId, updates) {
    return this.client.post(`${this.basePath}/${setId}/chapters/bulk`, { updates });
  }
  // ==========================================================================
  // Thumbnails
  // ==========================================================================
  /**
   * Generate thumbnail for a chapter
   *
   * Requires: chapters:update permission
   */
  async generateThumbnail(setId, chapterId, options) {
    return this.client.post(
      `${this.basePath}/${setId}/chapters/${chapterId}/thumbnail`,
      options
    );
  }
  /**
   * Generate thumbnails for all chapters in a set
   *
   * Requires: chapters:update permission
   */
  async generateAllThumbnails(setId) {
    return this.client.post(`${this.basePath}/${setId}/thumbnails`);
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export chapters in various formats
   *
   * Requires: chapters:read permission
   */
  async exportChapters(setId, format) {
    return this.client.get(`${this.basePath}/${setId}/export`, {
      params: { format }
    });
  }
  /**
   * Import chapters from a format
   *
   * Requires: chapters:create permission
   */
  async importChapters(mediaId, mediaType, format, content, options) {
    return this.client.post(`${this.basePath}/import`, {
      media_id: mediaId,
      media_type: mediaType,
      format,
      content,
      ...options
    });
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for chapter generation to complete
   */
  async waitForReady(setId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const set = await this.getSet(setId);
      if (options?.onProgress) {
        options.onProgress(set);
      }
      if (set.status === "ready") {
        return set;
      }
      if (set.status === "failed") {
        throw new Error(`Chapter generation failed: ${set.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Chapter generation timed out after ${timeout}ms`);
  }
  /**
   * Get chapter at a specific time
   *
   * Requires: chapters:read permission
   */
  async getChapterAtTime(setId, time) {
    try {
      return await this.client.get(`${this.basePath}/${setId}/at`, {
        params: { time }
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  /**
   * Merge chapters
   *
   * Requires: chapters:update permission
   */
  async mergeChapters(setId, chapterIds, options) {
    return this.client.post(`${this.basePath}/${setId}/chapters/merge`, {
      chapter_ids: chapterIds,
      ...options
    });
  }
  /**
   * Split a chapter at a specific time
   *
   * Requires: chapters:update permission
   */
  async splitChapter(setId, chapterId, splitTime, options) {
    return this.client.post(`${this.basePath}/${setId}/chapters/${chapterId}/split`, {
      split_time: splitTime,
      ...options
    });
  }
};
function createChaptersAPI(client) {
  return new ChaptersAPI(client);
}

// src/studio-ai.ts
var StudioAIAPI = class {
  client;
  basePath = "/v1/studio-ai";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // AI Assistants
  // ==========================================================================
  /**
   * Start an AI assistant
   *
   * Requires: studio-ai:create permission
   */
  async startAssistant(request) {
    return this.client.post(`${this.basePath}/assistants`, request);
  }
  /**
   * Get an assistant by ID
   *
   * Requires: studio-ai:read permission
   */
  async getAssistant(assistantId) {
    return this.client.get(`${this.basePath}/assistants/${assistantId}`);
  }
  /**
   * Update an assistant
   *
   * Requires: studio-ai:update permission
   */
  async updateAssistant(assistantId, request) {
    return this.client.patch(
      `${this.basePath}/assistants/${assistantId}`,
      request
    );
  }
  /**
   * Stop an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async stopAssistant(assistantId) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/stop`
    );
  }
  /**
   * Pause an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async pauseAssistant(assistantId) {
    return this.updateAssistant(assistantId, { status: "paused" });
  }
  /**
   * Resume an assistant
   *
   * Requires: studio-ai:manage permission
   */
  async resumeAssistant(assistantId) {
    return this.updateAssistant(assistantId, { status: "active" });
  }
  /**
   * List assistants
   *
   * Requires: studio-ai:read permission
   */
  async listAssistants(params) {
    return this.client.get(
      `${this.basePath}/assistants`,
      { params }
    );
  }
  /**
   * Get assistant statistics
   *
   * Requires: studio-ai:read permission
   */
  async getAssistantStats(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/stats`
    );
  }
  // ==========================================================================
  // Suggestions
  // ==========================================================================
  /**
   * List suggestions
   *
   * Requires: studio-ai:read permission
   */
  async listSuggestions(params) {
    return this.client.get(
      `${this.basePath}/suggestions`,
      { params }
    );
  }
  /**
   * Get a suggestion by ID
   *
   * Requires: studio-ai:read permission
   */
  async getSuggestion(suggestionId) {
    return this.client.get(
      `${this.basePath}/suggestions/${suggestionId}`
    );
  }
  /**
   * Accept a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async acceptSuggestion(suggestionId) {
    return this.client.post(
      `${this.basePath}/suggestions/${suggestionId}/accept`
    );
  }
  /**
   * Reject a suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async rejectSuggestion(suggestionId, reason) {
    return this.client.post(
      `${this.basePath}/suggestions/${suggestionId}/reject`,
      { reason }
    );
  }
  /**
   * Apply a suggestion immediately
   *
   * Requires: studio-ai:apply permission
   */
  async applySuggestion(suggestionId) {
    return this.client.post(
      `${this.basePath}/suggestions/${suggestionId}/apply`
    );
  }
  // ==========================================================================
  // Auto-Director
  // ==========================================================================
  /**
   * Get scene recommendations
   *
   * Requires: studio-ai:read permission
   */
  async getSceneRecommendations(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/director/scenes`
    );
  }
  /**
   * Set auto-director rules
   *
   * Requires: studio-ai:update permission
   */
  async setDirectorRules(assistantId, rules) {
    return this.client.post(`${this.basePath}/assistants/${assistantId}/director/rules`, {
      rules
    });
  }
  /**
   * Trigger manual scene switch via AI
   *
   * Requires: studio-ai:apply permission
   */
  async suggestSceneSwitch(assistantId, options) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/director/suggest`,
      options
    );
  }
  // ==========================================================================
  // Graphics Operator
  // ==========================================================================
  /**
   * Get graphics suggestions
   *
   * Requires: studio-ai:read permission
   */
  async getGraphicsSuggestions(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/graphics/suggestions`
    );
  }
  /**
   * Generate lower third for speaker
   *
   * Requires: studio-ai:apply permission
   */
  async generateLowerThird(assistantId, speakerInfo) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/graphics/lower-third`,
      speakerInfo
    );
  }
  // ==========================================================================
  // Audio Mixer
  // ==========================================================================
  /**
   * Get audio mix suggestions
   *
   * Requires: studio-ai:read permission
   */
  async getAudioSuggestions(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/audio/suggestions`
    );
  }
  /**
   * Auto-level audio sources
   *
   * Requires: studio-ai:apply permission
   */
  async autoLevelAudio(assistantId) {
    return this.client.post(`${this.basePath}/assistants/${assistantId}/audio/auto-level`);
  }
  // ==========================================================================
  // Content Moderation
  // ==========================================================================
  /**
   * Get moderation alerts
   *
   * Requires: studio-ai:read permission
   */
  async getModerationAlerts(assistantId, params) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts`,
      { params }
    );
  }
  /**
   * Dismiss a moderation alert
   *
   * Requires: studio-ai:apply permission
   */
  async dismissAlert(assistantId, alertId) {
    await this.client.post(
      `${this.basePath}/assistants/${assistantId}/moderation/alerts/${alertId}/dismiss`
    );
  }
  /**
   * Set moderation sensitivity
   *
   * Requires: studio-ai:update permission
   */
  async setModerationSensitivity(assistantId, settings) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/moderation/sensitivity`,
      settings
    );
  }
  // ==========================================================================
  // Engagement Manager
  // ==========================================================================
  /**
   * Get engagement insights
   *
   * Requires: studio-ai:read permission
   */
  async getEngagementInsights(assistantId, params) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/engagement/insights`,
      { params }
    );
  }
  /**
   * Get optimal interaction times
   *
   * Requires: studio-ai:read permission
   */
  async getOptimalInteractionTimes(assistantId) {
    return this.client.get(
      `${this.basePath}/assistants/${assistantId}/engagement/optimal-times`
    );
  }
  /**
   * Generate engagement suggestion
   *
   * Requires: studio-ai:apply permission
   */
  async generateEngagementAction(assistantId, type) {
    return this.client.post(
      `${this.basePath}/assistants/${assistantId}/engagement/generate`,
      { type }
    );
  }
};
function createStudioAIAPI(client) {
  return new StudioAIAPI(client);
}

// src/transcribe.ts
var TranscribeAPI = class {
  client;
  basePath = "/v1/transcribe";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Transcriptions
  // ==========================================================================
  /**
   * Create a transcription job
   *
   * Requires: transcribe:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a transcription by ID
   *
   * Requires: transcribe:read permission
   */
  async get(transcriptionId) {
    return this.client.get(`${this.basePath}/${transcriptionId}`);
  }
  /**
   * Update a transcription
   *
   * Requires: transcribe:update permission
   */
  async update(transcriptionId, request) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}`,
      request
    );
  }
  /**
   * Remove a transcription
   *
   * Requires: transcribe:remove permission (server-side RBAC enforced)
   */
  async remove(transcriptionId) {
    await this.client.delete(
      `${this.basePath}/${transcriptionId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List transcriptions
   *
   * Requires: transcribe:read permission
   */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  // ==========================================================================
  // Segments
  // ==========================================================================
  /**
   * Get transcription segments
   *
   * Requires: transcribe:read permission
   */
  async getSegments(transcriptionId, params) {
    return this.client.get(
      `${this.basePath}/${transcriptionId}/segments`,
      { params }
    );
  }
  /**
   * Update a segment
   *
   * Requires: transcribe:update permission
   */
  async updateSegment(transcriptionId, segmentId, updates) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}`,
      updates
    );
  }
  /**
   * Merge segments
   *
   * Requires: transcribe:update permission
   */
  async mergeSegments(transcriptionId, segmentIds) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/segments/merge`,
      { segment_ids: segmentIds }
    );
  }
  /**
   * Split a segment
   *
   * Requires: transcribe:update permission
   */
  async splitSegment(transcriptionId, segmentId, splitTime) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}/split`,
      { split_time: splitTime }
    );
  }
  // ==========================================================================
  // Speakers
  // ==========================================================================
  /**
   * Get speakers
   *
   * Requires: transcribe:read permission
   */
  async getSpeakers(transcriptionId) {
    return this.client.get(
      `${this.basePath}/${transcriptionId}/speakers`
    );
  }
  /**
   * Update speaker label
   *
   * Requires: transcribe:update permission
   */
  async updateSpeaker(transcriptionId, speakerId, label) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}/speakers/${speakerId}`,
      { label }
    );
  }
  /**
   * Merge speakers
   *
   * Requires: transcribe:update permission
   */
  async mergeSpeakers(transcriptionId, speakerIds, newLabel) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/speakers/merge`,
      { speaker_ids: speakerIds, label: newLabel }
    );
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export transcription
   *
   * Requires: transcribe:read permission
   */
  async exportTranscription(transcriptionId, format, options) {
    return this.client.post(`${this.basePath}/${transcriptionId}/export`, {
      format,
      ...options
    });
  }
  /**
   * Get plain text transcript
   *
   * Requires: transcribe:read permission
   */
  async getText(transcriptionId, options) {
    const result = await this.client.get(
      `${this.basePath}/${transcriptionId}/text`,
      { params: options }
    );
    return result.text;
  }
  // ==========================================================================
  // Search
  // ==========================================================================
  /**
   * Search within a transcription
   *
   * Requires: transcribe:read permission
   */
  async search(transcriptionId, query, options) {
    return this.client.post(`${this.basePath}/${transcriptionId}/search`, {
      query,
      ...options
    });
  }
  // ==========================================================================
  // Real-time
  // ==========================================================================
  /**
   * Start real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async startRealtime(streamId, options) {
    return this.client.post(`${this.basePath}/realtime/start`, {
      stream_id: streamId,
      ...options
    });
  }
  /**
   * Stop real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async stopRealtime(sessionId) {
    return this.client.post(
      `${this.basePath}/realtime/${sessionId}/stop`
    );
  }
  /**
   * Get real-time session status
   *
   * Requires: transcribe:read permission
   */
  async getRealtimeStatus(sessionId) {
    return this.client.get(`${this.basePath}/realtime/${sessionId}`);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for transcription to complete
   */
  async waitForReady(transcriptionId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const transcription = await this.get(transcriptionId);
      if (options?.onProgress) {
        options.onProgress(transcription);
      }
      if (transcription.status === "ready") {
        return transcription;
      }
      if (transcription.status === "failed") {
        throw new Error(
          `Transcription failed: ${transcription.error || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Transcription timed out after ${timeout}ms`);
  }
  /**
   * Detect language from audio
   *
   * Requires: transcribe:read permission
   */
  async detectLanguage(sourceUrl) {
    return this.client.post(`${this.basePath}/detect-language`, {
      source_url: sourceUrl
    });
  }
  /**
   * Get supported languages
   *
   * Requires: transcribe:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
  /**
   * Estimate transcription cost
   *
   * Requires: transcribe:read permission
   */
  async estimateCost(durationSeconds, model = "standard", options) {
    return this.client.post(`${this.basePath}/estimate`, {
      duration_seconds: durationSeconds,
      model,
      ...options
    });
  }
};
function createTranscribeAPI(client) {
  return new TranscribeAPI(client);
}

// src/sentiment.ts
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

// src/search.ts
var SearchAPI = class {
  client;
  basePath = "/v1/search";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Search
  // ==========================================================================
  /**
   * Search content
   *
   * Requires: search:query permission
   */
  async search(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Quick search (simplified API)
   *
   * Requires: search:query permission
   */
  async quickSearch(query, options) {
    const response = await this.search({
      query,
      mode: "semantic",
      types: options?.types,
      filters: options?.filters,
      limit: options?.limit || 10
    });
    return response.results;
  }
  /**
   * Search within a specific media
   *
   * Requires: search:query permission
   */
  async searchInMedia(mediaId, mediaType, query, options) {
    return this.client.post(`${this.basePath}/media`, {
      media_id: mediaId,
      media_type: mediaType,
      query,
      ...options
    });
  }
  // ==========================================================================
  // Visual Search
  // ==========================================================================
  /**
   * Visual search (search by image)
   *
   * Requires: search:visual permission
   */
  async visualSearch(request) {
    return this.client.post(`${this.basePath}/visual`, request);
  }
  /**
   * Find similar frames
   *
   * Requires: search:visual permission
   */
  async findSimilarFrames(mediaId, timestamp, options) {
    return this.client.post(`${this.basePath}/visual/similar`, {
      media_id: mediaId,
      timestamp,
      ...options
    });
  }
  /**
   * Detect objects in media
   *
   * Requires: search:visual permission
   */
  async detectObjects(mediaId, options) {
    return this.client.post(`${this.basePath}/visual/objects`, {
      media_id: mediaId,
      ...options
    });
  }
  // ==========================================================================
  // Audio Search
  // ==========================================================================
  /**
   * Audio search (search by audio)
   *
   * Requires: search:audio permission
   */
  async audioSearch(request) {
    return this.client.post(`${this.basePath}/audio`, request);
  }
  /**
   * Find similar audio segments
   *
   * Requires: search:audio permission
   */
  async findSimilarAudio(mediaId, startTime, endTime, options) {
    return this.client.post(`${this.basePath}/audio/similar`, {
      media_id: mediaId,
      start_time: startTime,
      end_time: endTime,
      ...options
    });
  }
  /**
   * Detect music in media
   *
   * Requires: search:audio permission
   */
  async detectMusic(mediaId) {
    return this.client.get(`${this.basePath}/audio/music/${mediaId}`);
  }
  // ==========================================================================
  // Suggestions
  // ==========================================================================
  /**
   * Get search suggestions
   *
   * Requires: search:query permission
   */
  async getSuggestions(prefix, options) {
    return this.client.get(`${this.basePath}/suggest`, {
      params: { prefix, ...options }
    });
  }
  /**
   * Get trending searches
   *
   * Requires: search:query permission
   */
  async getTrending(options) {
    return this.client.get(`${this.basePath}/trending`, { params: options });
  }
  // ==========================================================================
  // Indexing
  // ==========================================================================
  /**
   * Index media for search
   *
   * Requires: search:index permission
   */
  async indexMedia(mediaId, mediaType, options) {
    return this.client.post(`${this.basePath}/index`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options
    });
  }
  /**
   * Get index status
   *
   * Requires: search:read permission
   */
  async getIndexStatus(mediaId) {
    return this.client.get(`${this.basePath}/index/${mediaId}`);
  }
  /**
   * Reindex media
   *
   * Requires: search:index permission
   */
  async reindexMedia(mediaId, options) {
    return this.client.post(
      `${this.basePath}/index/${mediaId}/reindex`,
      options
    );
  }
  /**
   * Remove media from index
   *
   * Requires: search:index permission (server-side RBAC enforced)
   */
  async removeFromIndex(mediaId) {
    await this.client.delete(
      `${this.basePath}/index/${mediaId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Saved Searches
  // ==========================================================================
  /**
   * Save a search
   *
   * Requires: search:save permission
   */
  async saveSearch(name, request, options) {
    return this.client.post(`${this.basePath}/saved`, {
      name,
      query: request,
      ...options
    });
  }
  /**
   * List saved searches
   *
   * Requires: search:read permission
   */
  async listSavedSearches(params) {
    return this.client.get(`${this.basePath}/saved`, { params });
  }
  /**
   * Run a saved search
   *
   * Requires: search:query permission
   */
  async runSavedSearch(savedSearchId) {
    return this.client.post(
      `${this.basePath}/saved/${savedSearchId}/run`
    );
  }
  /**
   * Remove a saved search
   *
   * Requires: search:save permission (server-side RBAC enforced)
   */
  async removeSavedSearch(savedSearchId) {
    await this.client.delete(
      `${this.basePath}/saved/${savedSearchId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Analytics
  // ==========================================================================
  /**
   * Get search analytics
   *
   * Requires: search:analytics permission
   */
  async getAnalytics(options) {
    return this.client.get(`${this.basePath}/analytics`, { params: options });
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for indexing to complete
   */
  async waitForIndex(mediaId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const status = await this.getIndexStatus(mediaId);
      if (options?.onProgress) {
        options.onProgress(status);
      }
      if (status.status === "ready") {
        return status;
      }
      if (status.status === "failed") {
        throw new Error(`Indexing failed: ${status.error || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Indexing timed out after ${timeout}ms`);
  }
};
function createSearchAPI(client) {
  return new SearchAPI(client);
}

// src/scene.ts
var SceneAPI = class {
  client;
  basePath = "/v1/scene";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Scene Detection
  // ==========================================================================
  /**
   * Start scene detection
   *
   * Requires: scene:detect permission
   */
  async detect(request) {
    return this.client.post(`${this.basePath}/detect`, request);
  }
  /**
   * Get scene detection job
   *
   * Requires: scene:read permission
   */
  async getDetection(detectionId) {
    return this.client.get(`${this.basePath}/${detectionId}`);
  }
  /**
   * Remove scene detection
   *
   * Requires: scene:remove permission (server-side RBAC enforced)
   */
  async removeDetection(detectionId) {
    await this.client.delete(
      `${this.basePath}/${detectionId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List scene detections
   *
   * Requires: scene:read permission
   */
  async listDetections(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  // ==========================================================================
  // Scenes
  // ==========================================================================
  /**
   * Get scenes for a detection
   *
   * Requires: scene:read permission
   */
  async getScenes(detectionId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes`,
      { params }
    );
  }
  /**
   * Get a specific scene
   *
   * Requires: scene:read permission
   */
  async getScene(detectionId, sceneId) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`
    );
  }
  /**
   * Update scene metadata
   *
   * Requires: scene:update permission
   */
  async updateScene(detectionId, sceneId, updates) {
    return this.client.patch(
      `${this.basePath}/${detectionId}/scenes/${sceneId}`,
      updates
    );
  }
  /**
   * Get scene at a specific timestamp
   *
   * Requires: scene:read permission
   */
  async getSceneAtTime(detectionId, timestamp) {
    try {
      return await this.client.get(
        `${this.basePath}/${detectionId}/scenes/at`,
        { params: { timestamp } }
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  // ==========================================================================
  // Scene Boundaries
  // ==========================================================================
  /**
   * Get scene boundaries (transitions)
   *
   * Requires: scene:read permission
   */
  async getBoundaries(detectionId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/boundaries`,
      { params }
    );
  }
  /**
   * Detect scene boundaries only (without full analysis)
   *
   * Requires: scene:detect permission
   */
  async detectBoundaries(mediaId, mediaType, options) {
    return this.client.post(`${this.basePath}/boundaries`, {
      media_id: mediaId,
      media_type: mediaType,
      ...options
    });
  }
  // ==========================================================================
  // Shots
  // ==========================================================================
  /**
   * Get shots for a scene
   *
   * Requires: scene:read permission
   */
  async getShots(detectionId, sceneId, params) {
    return this.client.get(
      `${this.basePath}/${detectionId}/scenes/${sceneId}/shots`,
      { params }
    );
  }
  /**
   * Get all shots for a detection
   *
   * Requires: scene:read permission
   */
  async getAllShots(detectionId, params) {
    return this.client.get(`${this.basePath}/${detectionId}/shots`, { params });
  }
  // ==========================================================================
  // Analysis
  // ==========================================================================
  /**
   * Get scene summary/statistics
   *
   * Requires: scene:read permission
   */
  async getSummary(detectionId) {
    return this.client.get(`${this.basePath}/${detectionId}/summary`);
  }
  /**
   * Get visual timeline
   *
   * Requires: scene:read permission
   */
  async getTimeline(detectionId, options) {
    return this.client.get(`${this.basePath}/${detectionId}/timeline`, {
      params: options
    });
  }
  /**
   * Compare scenes between detections
   *
   * Requires: scene:read permission
   */
  async compareScenes(sourceDetectionId, targetDetectionId, options) {
    return this.client.post(`${this.basePath}/compare`, {
      source_detection_id: sourceDetectionId,
      target_detection_id: targetDetectionId,
      ...options
    });
  }
  /**
   * Find similar scenes across all content
   *
   * Requires: scene:read permission
   */
  async findSimilarScenes(detectionId, sceneId, options) {
    return this.client.get(`${this.basePath}/${detectionId}/scenes/${sceneId}/similar`, {
      params: options
    });
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export scene data
   *
   * Requires: scene:read permission
   */
  async exportDetection(detectionId, format) {
    return this.client.post(`${this.basePath}/${detectionId}/export`, { format });
  }
  /**
   * Generate scene thumbnails
   *
   * Requires: scene:update permission
   */
  async generateThumbnails(detectionId, options) {
    return this.client.post(`${this.basePath}/${detectionId}/thumbnails`, options);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for scene detection to complete
   */
  async waitForReady(detectionId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const detection = await this.getDetection(detectionId);
      if (options?.onProgress) {
        options.onProgress(detection);
      }
      if (detection.status === "ready") {
        return detection;
      }
      if (detection.status === "failed") {
        throw new Error(
          `Scene detection failed: ${detection.error || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Scene detection timed out after ${timeout}ms`);
  }
  /**
   * Merge scenes
   *
   * Requires: scene:update permission
   */
  async mergeScenes(detectionId, sceneIds, options) {
    return this.client.post(
      `${this.basePath}/${detectionId}/scenes/merge`,
      { scene_ids: sceneIds, ...options }
    );
  }
  /**
   * Split scene at timestamp
   *
   * Requires: scene:update permission
   */
  async splitScene(detectionId, sceneId, splitTime) {
    return this.client.post(`${this.basePath}/${detectionId}/scenes/${sceneId}/split`, {
      split_time: splitTime
    });
  }
};
function createSceneAPI(client) {
  return new SceneAPI(client);
}

// src/pipeline.ts
var PipelineAPI = class {
  client;
  basePath = "/v1/streams";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Stream CRUD
  // ==========================================================================
  /**
   * Create a new stream
   *
   * Requires: streams:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a stream by ID
   *
   * Requires: streams:read permission
   */
  async get(streamId) {
    return this.client.get(`${this.basePath}/${streamId}`);
  }
  /**
   * Update a stream
   *
   * Requires: streams:update permission
   */
  async update(streamId, request) {
    return this.client.patch(`${this.basePath}/${streamId}`, request);
  }
  /**
   * Remove a stream
   *
   * Requires: streams:remove permission (server-side RBAC enforced)
   */
  async remove(streamId) {
    await this.client.delete(`${this.basePath}/${streamId}`);
  }
  /**
   * List streams with optional filters
   *
   * Requires: streams:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      protocol: params?.protocol,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  // ==========================================================================
  // Stream Lifecycle
  // ==========================================================================
  /**
   * Start a stream
   *
   * Transitions the stream from idle to connecting. The stream will move
   * to "live" once media is received on the ingest endpoint.
   *
   * Requires: streams:start permission
   */
  async start(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/start`);
  }
  /**
   * Stop a stream
   *
   * Gracefully ends the stream. Any active recording will be finalized.
   *
   * Requires: streams:stop permission
   */
  async stop(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/stop`);
  }
  /**
   * Switch the ingest protocol for a live stream
   *
   * Performs a zero-downtime protocol switch. The stream will briefly
   * enter "reconnecting" status during the transition.
   *
   * Requires: streams:update permission
   */
  async switchProtocol(streamId, protocol) {
    return this.client.post(`${this.basePath}/${streamId}/switch-protocol`, { protocol });
  }
  // ==========================================================================
  // Health & Monitoring
  // ==========================================================================
  /**
   * Get real-time health metrics for a stream
   *
   * Returns current bitrate, frame rate, latency, and overall health status.
   *
   * Requires: streams:read permission
   */
  async getHealth(streamId) {
    return this.client.get(`${this.basePath}/${streamId}/health`);
  }
  /**
   * Get ingest endpoints for a stream
   *
   * Returns primary and backup URLs for each configured protocol.
   *
   * Requires: streams:read permission
   */
  async getIngestEndpoints(streamId) {
    return this.client.get(`${this.basePath}/${streamId}/ingest-endpoints`);
  }
  // ==========================================================================
  // Recording
  // ==========================================================================
  /**
   * Start recording a live stream
   *
   * Begins capturing the stream to a file. The stream must be in "live" status.
   *
   * Requires: streams:record permission
   */
  async startRecording(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/recordings/start`);
  }
  /**
   * Stop recording a live stream
   *
   * Finalizes the current recording. The recording enters "processing" status
   * while it is being packaged.
   *
   * Requires: streams:record permission
   */
  async stopRecording(streamId) {
    return this.client.post(`${this.basePath}/${streamId}/recordings/stop`);
  }
  /**
   * List recordings for a stream
   *
   * Requires: streams:read permission
   */
  async listRecordings(streamId, params) {
    return this.client.get(
      `${this.basePath}/${streamId}/recordings`,
      { params }
    );
  }
  /**
   * Get a specific recording
   *
   * Requires: streams:read permission
   */
  async getRecording(streamId, recordingId) {
    return this.client.get(
      `${this.basePath}/${streamId}/recordings/${recordingId}`
    );
  }
  // ==========================================================================
  // Viewers
  // ==========================================================================
  /**
   * List active viewer sessions for a stream
   *
   * Requires: streams:read permission
   */
  async listViewers(streamId, params) {
    return this.client.get(
      `${this.basePath}/${streamId}/viewers`,
      { params }
    );
  }
  /**
   * Get current and peak viewer count for a stream
   *
   * Requires: streams:read permission
   */
  async getViewerCount(streamId) {
    return this.client.get(
      `${this.basePath}/${streamId}/viewers/count`
    );
  }
  // ==========================================================================
  // Polling Helpers
  // ==========================================================================
  /**
   * Wait for a stream to reach "live" status
   *
   * Polls the stream until it transitions to "live" or a terminal state.
   * Useful after calling `start()` to wait for the encoder to connect.
   *
   * @param streamId - Stream to monitor
   * @param options - Polling configuration
   * @param options.pollInterval - Milliseconds between polls (default: 2000)
   * @param options.timeout - Maximum wait time in milliseconds (default: 120000)
   * @param options.onProgress - Called on each poll with the current stream state
   * @returns The stream once it reaches "live" status
   * @throws Error if the stream enters "failed" or "ended" status, or if the timeout is exceeded
   */
  async waitForLive(streamId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 12e4;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const stream = await this.get(streamId);
      if (options?.onProgress) {
        options.onProgress(stream);
      }
      if (stream.status === "live") {
        return stream;
      }
      if (stream.status === "failed") {
        throw new Error(`Stream failed to go live: ${stream.id}`);
      }
      if (stream.status === "ended") {
        throw new Error(`Stream ended before going live: ${stream.id}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Stream did not go live within ${timeout}ms`);
  }
};
function createPipelineAPI(client) {
  return new PipelineAPI(client);
}

// src/studio.ts
var StudioAPI = class {
  client;
  basePath = "/v1/productions";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Production CRUD
  // ==========================================================================
  /**
   * Create a new production
   *
   * Requires: productions:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a production by ID
   *
   * Requires: productions:read permission
   */
  async get(productionId) {
    return this.client.get(`${this.basePath}/${productionId}`);
  }
  /**
   * Update a production
   *
   * Requires: productions:update permission
   */
  async update(productionId, request) {
    return this.client.patch(`${this.basePath}/${productionId}`, request);
  }
  /**
   * Remove a production
   *
   * Requires: productions:remove permission (server-side RBAC enforced)
   */
  async remove(productionId) {
    await this.client.delete(`${this.basePath}/${productionId}`);
  }
  /**
   * List productions with optional filters
   *
   * Requires: productions:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  // ==========================================================================
  // Production Lifecycle
  // ==========================================================================
  /**
   * Start a production (go live)
   *
   * Transitions the production from 'idle' or 'rehearsal' to 'live'.
   *
   * Requires: productions:control permission
   */
  async start(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/start`);
  }
  /**
   * Stop a production (end broadcast)
   *
   * Transitions the production to 'ending' and then 'ended'.
   *
   * Requires: productions:control permission
   */
  async stop(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/stop`);
  }
  /**
   * Start a rehearsal session
   *
   * Allows testing sources, scenes, and transitions without going live.
   * Transitions the production from 'idle' to 'rehearsal'.
   *
   * Requires: productions:control permission
   */
  async startRehearsal(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/rehearsal`);
  }
  // ==========================================================================
  // Sources
  // ==========================================================================
  /**
   * Add an input source to a production
   *
   * Requires: productions:sources:create permission
   */
  async addSource(productionId, source) {
    return this.client.post(`${this.basePath}/${productionId}/sources`, source);
  }
  /**
   * Remove a source from a production
   *
   * Requires: productions:sources:remove permission
   */
  async removeSource(productionId, sourceId) {
    await this.client.delete(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }
  /**
   * List all sources for a production
   *
   * Requires: productions:sources:read permission
   */
  async listSources(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/sources`);
  }
  /**
   * Get a specific source by ID
   *
   * Requires: productions:sources:read permission
   */
  async getSource(productionId, sourceId) {
    return this.client.get(`${this.basePath}/${productionId}/sources/${sourceId}`);
  }
  // ==========================================================================
  // Scenes
  // ==========================================================================
  /**
   * Create a new scene in a production
   *
   * Requires: productions:scenes:create permission
   */
  async createScene(productionId, scene) {
    return this.client.post(`${this.basePath}/${productionId}/scenes`, scene);
  }
  /**
   * Update an existing scene
   *
   * Requires: productions:scenes:update permission
   */
  async updateScene(productionId, sceneId, updates) {
    return this.client.patch(`${this.basePath}/${productionId}/scenes/${sceneId}`, updates);
  }
  /**
   * Remove a scene from a production
   *
   * Requires: productions:scenes:remove permission
   */
  async removeScene(productionId, sceneId) {
    await this.client.delete(`${this.basePath}/${productionId}/scenes/${sceneId}`);
  }
  /**
   * List all scenes for a production
   *
   * Requires: productions:scenes:read permission
   */
  async listScenes(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/scenes`);
  }
  /**
   * Activate a scene with an optional transition
   *
   * Sets the scene as the active scene for the production output.
   *
   * Requires: productions:scenes:control permission
   */
  async activateScene(productionId, sceneId, transition) {
    return this.client.post(
      `${this.basePath}/${productionId}/scenes/${sceneId}/activate`,
      transition ? { transition } : void 0
    );
  }
  // ==========================================================================
  // Switching (Program / Preview / Transition)
  // ==========================================================================
  /**
   * Set the program (live) source with an optional transition
   *
   * Switches the currently live output to the specified source.
   *
   * Requires: productions:control permission
   */
  async setProgram(productionId, sourceId, transition) {
    await this.client.post(`${this.basePath}/${productionId}/program`, {
      source_id: sourceId,
      transition
    });
  }
  /**
   * Set the preview source
   *
   * Loads a source into the preview output for inspection before going live.
   *
   * Requires: productions:control permission
   */
  async setPreview(productionId, sourceId) {
    await this.client.post(`${this.basePath}/${productionId}/preview`, { source_id: sourceId });
  }
  /**
   * Execute a transition between preview and program
   *
   * Swaps the current preview source into program using the specified transition.
   *
   * Requires: productions:control permission
   */
  async transition(productionId, config) {
    await this.client.post(`${this.basePath}/${productionId}/transition`, config);
  }
  // ==========================================================================
  // Graphics
  // ==========================================================================
  /**
   * Add a graphic overlay to a production
   *
   * Requires: productions:graphics:create permission
   */
  async addGraphic(productionId, graphic) {
    return this.client.post(`${this.basePath}/${productionId}/graphics`, graphic);
  }
  /**
   * Update an existing graphic
   *
   * Requires: productions:graphics:update permission
   */
  async updateGraphic(productionId, graphicId, updates) {
    return this.client.patch(
      `${this.basePath}/${productionId}/graphics/${graphicId}`,
      updates
    );
  }
  /**
   * Remove a graphic from a production
   *
   * Requires: productions:graphics:remove permission
   */
  async removeGraphic(productionId, graphicId) {
    await this.client.delete(`${this.basePath}/${productionId}/graphics/${graphicId}`);
  }
  /**
   * Show a graphic on the production output
   *
   * Makes the graphic visible on the live output.
   *
   * Requires: productions:graphics:control permission
   */
  async showGraphic(productionId, graphicId) {
    await this.client.post(`${this.basePath}/${productionId}/graphics/${graphicId}/show`);
  }
  /**
   * Hide a graphic from the production output
   *
   * Removes the graphic from the live output without deleting it.
   *
   * Requires: productions:graphics:control permission
   */
  async hideGraphic(productionId, graphicId) {
    await this.client.post(`${this.basePath}/${productionId}/graphics/${graphicId}/hide`);
  }
  // ==========================================================================
  // Audio Mix
  // ==========================================================================
  /**
   * Get the current audio mix for a production
   *
   * Returns volume, mute, solo, pan, and processing settings for all channels.
   *
   * Requires: productions:audio:read permission
   */
  async getAudioMix(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/audio-mix`);
  }
  /**
   * Set the audio mix for a production
   *
   * Updates volume, mute, solo, pan, and processing settings for channels.
   *
   * Requires: productions:audio:control permission
   */
  async setAudioMix(productionId, channels) {
    return this.client.put(`${this.basePath}/${productionId}/audio-mix`, {
      channels
    });
  }
};
function createStudioAPI(client) {
  return new StudioAPI(client);
}

// src/fleet.ts
var FleetAPI = class {
  client;
  basePath = "/v1/fleet/nodes";
  constructor(client) {
    this.client = client;
  }
  /**
   * List fleet nodes with optional filters
   *
   * Requires: fleet:read permission
   */
  async list(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      health: params?.health,
      os: params?.os,
      order_by: params?.order_by,
      order: params?.order
    };
    return this.client.get(this.basePath, {
      params: queryParams
    });
  }
  /**
   * Get a node by ID
   *
   * Requires: fleet:read permission
   */
  async get(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}`);
  }
  /**
   * Register a new node
   *
   * Requires: fleet:create permission
   */
  async register(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Update a node
   *
   * Requires: fleet:update permission
   */
  async update(nodeId, request) {
    return this.client.patch(`${this.basePath}/${nodeId}`, request);
  }
  /**
   * Deregister (remove) a node
   *
   * Requires: fleet:remove permission (server-side RBAC enforced)
   */
  async deregister(nodeId) {
    await this.client.delete(`${this.basePath}/${nodeId}`);
  }
  /**
   * Get current health status of a node
   *
   * Requires: fleet:read permission
   */
  async getHealth(nodeId) {
    return this.client.get(
      `${this.basePath}/${nodeId}/health`
    );
  }
  /**
   * List devices attached to a node
   *
   * Requires: fleet:read permission
   */
  async listDevices(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}/devices`);
  }
  /**
   * Send a command to a node
   *
   * Requires: fleet:command permission
   */
  async sendCommand(nodeId, command) {
    return this.client.post(
      `${this.basePath}/${nodeId}/commands`,
      command
    );
  }
  /**
   * Get current resource metrics for a node
   *
   * Requires: fleet:read permission
   */
  async getMetrics(nodeId) {
    return this.client.get(`${this.basePath}/${nodeId}/metrics`);
  }
  /**
   * Wait for a node to come online
   */
  async waitForOnline(nodeId, options) {
    const pollInterval = options?.pollInterval || 5e3;
    const timeout = options?.timeout || 12e4;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const node = await this.get(nodeId);
      if (options?.onProgress) {
        options.onProgress(node);
      }
      if (node.status === "online") {
        return node;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Node ${nodeId} did not come online within ${timeout}ms`);
  }
};
function createFleetAPI(client) {
  return new FleetAPI(client);
}

// src/ghost.ts
var GhostAPI = class {
  client;
  basePath = "/v1/productions";
  constructor(client) {
    this.client = client;
  }
  /**
   * Start an Autopilot directing session
   *
   * Requires: ghost:create permission
   */
  async start(request) {
    return this.client.post(
      `${this.basePath}/${request.production_id}/ghost`,
      request
    );
  }
  /**
   * Get the current Autopilot session for a production
   *
   * Requires: ghost:read permission
   */
  async get(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost`);
  }
  /**
   * Update an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async update(productionId, request) {
    return this.client.patch(`${this.basePath}/${productionId}/ghost`, request);
  }
  /**
   * Stop an Autopilot session
   *
   * Requires: ghost:stop permission
   */
  async stop(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/stop`);
  }
  /**
   * Pause an Autopilot session
   *
   * Requires: ghost:update permission
   */
  async pause(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/pause`);
  }
  /**
   * Resume a paused Autopilot session
   *
   * Requires: ghost:update permission
   */
  async resume(productionId) {
    return this.client.post(`${this.basePath}/${productionId}/ghost/resume`);
  }
  /**
   * Override the current shot with a manual selection
   *
   * Requires: ghost:override permission
   */
  async override(productionId, override) {
    await this.client.post(`${this.basePath}/${productionId}/ghost/override`, override);
  }
  /**
   * List AI suggestions for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async listSuggestions(productionId, params) {
    return this.client.get(
      `${this.basePath}/${productionId}/ghost/suggestions`,
      { params }
    );
  }
  /**
   * Accept an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async acceptSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/accept`
    );
  }
  /**
   * Reject an AI suggestion
   *
   * Requires: ghost:update permission
   */
  async rejectSuggestion(productionId, suggestionId) {
    return this.client.post(
      `${this.basePath}/${productionId}/ghost/suggestions/${suggestionId}/reject`
    );
  }
  /**
   * Get directing statistics for a production's Autopilot session
   *
   * Requires: ghost:read permission
   */
  async getStats(productionId) {
    return this.client.get(`${this.basePath}/${productionId}/ghost/stats`);
  }
};
function createGhostAPI(client) {
  return new GhostAPI(client);
}

// src/mesh.ts
var MeshAPI = class {
  client;
  basePath = "/v1/mesh";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Regions
  // ==========================================================================
  /**
   * List mesh regions with optional filters
   *
   * Requires: mesh:read permission
   */
  async listRegions(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      provider: params?.provider
    };
    return this.client.get(`${this.basePath}/regions`, {
      params: queryParams
    });
  }
  /**
   * Get a region by ID
   *
   * Requires: mesh:read permission
   */
  async getRegion(regionId) {
    return this.client.get(`${this.basePath}/regions/${regionId}`);
  }
  /**
   * Get health details for a region
   *
   * Requires: mesh:read permission
   */
  async getRegionHealth(regionId) {
    return this.client.get(`${this.basePath}/regions/${regionId}/health`);
  }
  // ==========================================================================
  // Peers
  // ==========================================================================
  /**
   * List mesh peers, optionally filtered by region
   *
   * Requires: mesh:read permission
   */
  async listPeers(regionId) {
    const queryParams = {
      region_id: regionId
    };
    return this.client.get(`${this.basePath}/peers`, {
      params: queryParams
    });
  }
  /**
   * Add a peer to a region
   *
   * Requires: mesh:create permission
   */
  async addPeer(regionId, endpoint) {
    return this.client.post(`${this.basePath}/peers`, {
      region_id: regionId,
      endpoint
    });
  }
  /**
   * Remove a peer
   *
   * Requires: mesh:remove permission (server-side RBAC enforced)
   */
  async removePeer(peerId) {
    await this.client.delete(`${this.basePath}/peers/${peerId}`);
  }
  // ==========================================================================
  // Failover Policies
  // ==========================================================================
  /**
   * Create a failover policy
   *
   * Requires: mesh:create permission
   */
  async createPolicy(request) {
    return this.client.post(`${this.basePath}/policies`, request);
  }
  /**
   * Update a failover policy
   *
   * Requires: mesh:update permission
   */
  async updatePolicy(policyId, updates) {
    return this.client.patch(`${this.basePath}/policies/${policyId}`, updates);
  }
  /**
   * Remove a failover policy
   *
   * Requires: mesh:remove permission (server-side RBAC enforced)
   */
  async removePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  /**
   * List failover policies
   *
   * Requires: mesh:read permission
   */
  async listPolicies(params) {
    return this.client.get(`${this.basePath}/policies`, {
      params
    });
  }
  // ==========================================================================
  // Failover Operations
  // ==========================================================================
  /**
   * Trigger a manual failover to a target region
   *
   * Requires: mesh:failover permission
   */
  async triggerFailover(policyId, targetRegion) {
    return this.client.post(`${this.basePath}/policies/${policyId}/failover`, {
      target_region: targetRegion
    });
  }
  /**
   * Get failover event history for a policy
   *
   * Requires: mesh:read permission
   */
  async getFailoverHistory(policyId, params) {
    return this.client.get(
      `${this.basePath}/policies/${policyId}/events`,
      { params }
    );
  }
  // ==========================================================================
  // Replication & Topology
  // ==========================================================================
  /**
   * Get replication status between regions
   *
   * Requires: mesh:read permission
   */
  async getReplicationStatus(sourceRegion, targetRegion) {
    const queryParams = {
      source_region: sourceRegion,
      target_region: targetRegion
    };
    return this.client.get(`${this.basePath}/replication`, {
      params: queryParams
    });
  }
  /**
   * Get the full mesh topology (regions, peers, and policies)
   *
   * Requires: mesh:read permission
   */
  async getTopology() {
    return this.client.get(`${this.basePath}/topology`);
  }
};
function createMeshAPI(client) {
  return new MeshAPI(client);
}

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

// src/prism.ts
var PrismAPI = class {
  client;
  basePath = "/v1/prism";
  constructor(client) {
    this.client = client;
  }
  async createDevice(request) {
    return this.client.post(`${this.basePath}/devices`, request);
  }
  async getDevice(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async updateDevice(deviceId, request) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}`, request);
  }
  async removeDevice(deviceId) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}`);
  }
  async listDevices(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async startDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/start`);
  }
  async stopDevice(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/stop`);
  }
  async getHealth(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/health`);
  }
  async discoverSources(options) {
    return this.client.post(`${this.basePath}/discovery`, options);
  }
  async getPresets(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}/presets`);
  }
  async setPreset(deviceId, request) {
    return this.client.put(`${this.basePath}/devices/${deviceId}/presets`, request);
  }
  async removePreset(deviceId, slotNumber) {
    await this.client.delete(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}`);
  }
  async recallPreset(deviceId, slotNumber) {
    await this.client.post(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}/recall`);
  }
};
function createPrismAPI(client) {
  return new PrismAPI(client);
}

// src/zoom.ts
var ZoomAPI = class {
  client;
  basePath = "/v1/zoom";
  constructor(client) {
    this.client = client;
  }
  async createMeeting(request) {
    return this.client.post(`${this.basePath}/meetings`, request);
  }
  async getMeeting(meetingId) {
    return this.client.get(`${this.basePath}/meetings/${meetingId}`);
  }
  async endMeeting(meetingId) {
    await this.client.post(`${this.basePath}/meetings/${meetingId}/end`);
  }
  async listMeetings(params) {
    return this.client.get(`${this.basePath}/meetings`, {
      params
    });
  }
  async listRooms(params) {
    return this.client.get(`${this.basePath}/rooms`, {
      params
    });
  }
  async getRoomStatus(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}`);
  }
  async getRecording(recordingId) {
    return this.client.get(`${this.basePath}/recordings/${recordingId}`);
  }
  async listRecordings(meetingId, params) {
    const path = meetingId ? `${this.basePath}/meetings/${meetingId}/recordings` : `${this.basePath}/recordings`;
    return this.client.get(path, {
      params
    });
  }
  async startRTMS(meetingId, config) {
    return this.client.post(
      `${this.basePath}/meetings/${meetingId}/rtms/start`,
      config
    );
  }
  async stopRTMS(meetingId) {
    return this.client.post(`${this.basePath}/meetings/${meetingId}/rtms/stop`);
  }
  async getRTMSStatus(meetingId) {
    return this.client.get(
      `${this.basePath}/meetings/${meetingId}/rtms`
    );
  }
};
function createZoomAPI(client) {
  return new ZoomAPI(client);
}

// src/vault.ts
var VaultAPI = class {
  client;
  basePath = "/v1/vault";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(`${this.basePath}/recordings`, {
      params
    });
  }
  async get(recordingId) {
    return this.client.get(`${this.basePath}/recordings/${recordingId}`);
  }
  async update(recordingId, updates) {
    return this.client.patch(`${this.basePath}/recordings/${recordingId}`, updates);
  }
  async remove(recordingId) {
    await this.client.delete(`${this.basePath}/recordings/${recordingId}`);
  }
  async getStorageUsage() {
    return this.client.get(`${this.basePath}/storage`);
  }
  async createUpload(request) {
    return this.client.post(`${this.basePath}/uploads`, request);
  }
  async completeUpload(uploadId) {
    return this.client.post(`${this.basePath}/uploads/${uploadId}/complete`);
  }
  async startRecording(streamId, options) {
    return this.client.post(`${this.basePath}/recordings`, {
      stream_id: streamId,
      ...options
    });
  }
  async stopRecording(streamId) {
    return this.client.post(`${this.basePath}/recordings/stop`, { stream_id: streamId });
  }
  async transcode(recordingId, request) {
    return this.client.post(
      `${this.basePath}/recordings/${recordingId}/transcode`,
      request
    );
  }
  async getTranscodeJob(jobId) {
    return this.client.get(`${this.basePath}/transcode/${jobId}`);
  }
  async createArchivePolicy(policy) {
    return this.client.post(`${this.basePath}/policies`, policy);
  }
  async listArchivePolicies() {
    return this.client.get(`${this.basePath}/policies`);
  }
  async removeArchivePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  async getDownloadUrl(recordingId) {
    return this.client.get(
      `${this.basePath}/recordings/${recordingId}/download`
    );
  }
};
function createVaultAPI(client) {
  return new VaultAPI(client);
}

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

// src/desktop.ts
var DesktopAPI = class {
  client;
  basePath = "/v1/desktop";
  constructor(client) {
    this.client = client;
  }
  async getInfo(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}`);
  }
  async getStatus(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/status`
    );
  }
  async listDevices(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/devices`);
  }
  async configure(nodeId, config) {
    return this.client.patch(`${this.basePath}/nodes/${nodeId}/config`, config);
  }
  async getConfig(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/config`);
  }
  async getLogs(nodeId, params) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/logs`, {
      params
    });
  }
  async getPerformance(nodeId) {
    return this.client.get(`${this.basePath}/nodes/${nodeId}/performance`);
  }
  async checkForUpdate(nodeId) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/updates`
    );
  }
  async installUpdate(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/updates/install`);
  }
  async restart(nodeId) {
    return this.client.post(`${this.basePath}/nodes/${nodeId}/restart`);
  }
};
function createDesktopAPI(client) {
  return new DesktopAPI(client);
}

// src/signage.ts
var SignageAPI = class {
  client;
  basePath = "/v1/signage";
  constructor(client) {
    this.client = client;
  }
  async listDisplays(params) {
    return this.client.get(`${this.basePath}/displays`, {
      params
    });
  }
  async getDisplay(displayId) {
    return this.client.get(`${this.basePath}/displays/${displayId}`);
  }
  async registerDisplay(request) {
    return this.client.post(`${this.basePath}/displays`, request);
  }
  async updateDisplay(displayId, updates) {
    return this.client.patch(`${this.basePath}/displays/${displayId}`, updates);
  }
  async removeDisplay(displayId) {
    await this.client.delete(`${this.basePath}/displays/${displayId}`);
  }
  async createPlaylist(request) {
    return this.client.post(`${this.basePath}/playlists`, request);
  }
  async updatePlaylist(playlistId, updates) {
    return this.client.patch(`${this.basePath}/playlists/${playlistId}`, updates);
  }
  async removePlaylist(playlistId) {
    await this.client.delete(`${this.basePath}/playlists/${playlistId}`);
  }
  async listPlaylists(params) {
    return this.client.get(`${this.basePath}/playlists`, {
      params
    });
  }
  async assignPlaylist(displayId, playlistId) {
    await this.client.post(`${this.basePath}/displays/${displayId}/playlist`, {
      playlist_id: playlistId
    });
  }
  async scheduleContent(request) {
    return this.client.post(`${this.basePath}/schedules`, request);
  }
  async listSchedules(displayId) {
    const path = displayId ? `${this.basePath}/displays/${displayId}/schedules` : `${this.basePath}/schedules`;
    return this.client.get(path);
  }
  async removeSchedule(scheduleId) {
    await this.client.delete(`${this.basePath}/schedules/${scheduleId}`);
  }
  async configureDisplay(displayId, config) {
    return this.client.patch(
      `${this.basePath}/displays/${displayId}/config`,
      config
    );
  }
};
function createSignageAPI(client) {
  return new SignageAPI(client);
}

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

// src/audience.ts
var AudienceAPI = class {
  client;
  basePath = "/v1/audience";
  constructor(client) {
    this.client = client;
  }
  async createPoll(request) {
    return this.client.post(`${this.basePath}/polls`, request);
  }
  async getPoll(pollId) {
    return this.client.get(`${this.basePath}/polls/${pollId}`);
  }
  async closePoll(pollId) {
    return this.client.post(`${this.basePath}/polls/${pollId}/close`);
  }
  async getPollResults(pollId) {
    return this.client.get(`${this.basePath}/polls/${pollId}/results`);
  }
  async vote(pollId, optionIds) {
    await this.client.post(`${this.basePath}/polls/${pollId}/vote`, { option_ids: optionIds });
  }
  async createQA(request) {
    return this.client.post(`${this.basePath}/qa`, request);
  }
  async getQA(sessionId) {
    return this.client.get(`${this.basePath}/qa/${sessionId}`);
  }
  async closeQA(sessionId) {
    return this.client.post(`${this.basePath}/qa/${sessionId}/close`);
  }
  async submitQuestion(sessionId, text) {
    return this.client.post(`${this.basePath}/qa/${sessionId}/questions`, { text });
  }
  async answerQuestion(sessionId, questionId, answer) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/answer`,
      { answer }
    );
  }
  async upvoteQuestion(sessionId, questionId) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/upvote`
    );
  }
  async pinQuestion(sessionId, questionId) {
    return this.client.post(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/pin`
    );
  }
  async sendReaction(streamId, type) {
    await this.client.post(`${this.basePath}/reactions`, { stream_id: streamId, type });
  }
  async getReactionMetrics(streamId) {
    return this.client.get(`${this.basePath}/reactions/${streamId}`);
  }
  async getEngagementMetrics(streamId) {
    return this.client.get(`${this.basePath}/engagement/${streamId}`);
  }
};
function createAudienceAPI(client) {
  return new AudienceAPI(client);
}

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

// src/podcast.ts
var PodcastAPI = class {
  client;
  basePath = "/v1/podcasts";
  constructor(client) {
    this.client = client;
  }
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  async get(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}`);
  }
  async update(podcastId, updates) {
    return this.client.patch(`${this.basePath}/${podcastId}`, updates);
  }
  async remove(podcastId) {
    await this.client.delete(`${this.basePath}/${podcastId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async createEpisode(request) {
    return this.client.post(`${this.basePath}/${request.podcast_id}/episodes`, request);
  }
  async getEpisode(episodeId) {
    return this.client.get(`/v1/episodes/${episodeId}`);
  }
  async updateEpisode(episodeId, updates) {
    return this.client.patch(`/v1/episodes/${episodeId}`, updates);
  }
  async removeEpisode(episodeId) {
    await this.client.delete(`/v1/episodes/${episodeId}`);
  }
  async publishEpisode(episodeId) {
    return this.client.post(`/v1/episodes/${episodeId}/publish`);
  }
  async listEpisodes(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/episodes`, {
      params
    });
  }
  async getRSSFeed(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/rss`);
  }
  async getAnalytics(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/analytics`, {
      params
    });
  }
  async distribute(podcastId, targets) {
    return this.client.post(`${this.basePath}/${podcastId}/distribute`, {
      targets
    });
  }
  async getDistributionStatus(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/distribution`);
  }
};
function createPodcastAPI(client) {
  return new PodcastAPI(client);
}

// src/slides.ts
var SlidesAPI = class {
  client;
  basePath = "/v1/slides";
  constructor(client) {
    this.client = client;
  }
  async convert(request) {
    return this.client.post(this.basePath, request);
  }
  async get(conversionId) {
    return this.client.get(`${this.basePath}/${conversionId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async remove(conversionId) {
    await this.client.delete(`${this.basePath}/${conversionId}`);
  }
  async getProgress(conversionId) {
    return this.client.get(
      `${this.basePath}/${conversionId}/progress`
    );
  }
  async addNarration(conversionId, narrations) {
    return this.client.post(`${this.basePath}/${conversionId}/narration`, {
      narrations
    });
  }
  async waitForReady(conversionId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const conversion = await this.get(conversionId);
      if (conversion.status === "ready") return conversion;
      if (conversion.status === "failed")
        throw new Error(`Conversion failed: ${conversion.error || "Unknown"}`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Conversion timed out after ${timeout}ms`);
  }
};
function createSlidesAPI(client) {
  return new SlidesAPI(client);
}

// src/usb.ts
var UsbAPI = class {
  client;
  basePath = "/v1/usb";
  constructor(client) {
    this.client = client;
  }
  async list(params) {
    return this.client.get(`${this.basePath}/devices`, {
      params
    });
  }
  async get(deviceId) {
    return this.client.get(`${this.basePath}/devices/${deviceId}`);
  }
  async claim(deviceId, request) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/claim`, request);
  }
  async release(deviceId) {
    return this.client.post(`${this.basePath}/devices/${deviceId}/release`);
  }
  async getCapabilities(deviceId) {
    return this.client.get(
      `${this.basePath}/devices/${deviceId}/capabilities`
    );
  }
  async listByNode(nodeId, params) {
    return this.client.get(
      `${this.basePath}/nodes/${nodeId}/devices`,
      { params }
    );
  }
  async configure(deviceId, config) {
    return this.client.patch(`${this.basePath}/devices/${deviceId}/config`, config);
  }
};
function createUsbAPI(client) {
  return new UsbAPI(client);
}

// src/notifications.ts
var NotificationsAPI = class {
  client;
  basePath = "/v1/notifications";
  constructor(client) {
    this.client = client;
  }
  /** List notifications with optional filters. */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /** Get a single notification by ID. */
  async get(notificationId) {
    return this.client.get(`${this.basePath}/${notificationId}`);
  }
  /** Mark a notification as read. */
  async markAsRead(notificationId) {
    return this.client.post(`${this.basePath}/${notificationId}/read`);
  }
  /** Mark all notifications as read. */
  async markAllRead() {
    return this.client.post(`${this.basePath}/mark-all-read`);
  }
  /** Archive a notification. */
  async archive(notificationId) {
    return this.client.post(`${this.basePath}/${notificationId}/archive`);
  }
  /** Delete a notification. */
  async remove(notificationId) {
    await this.client.delete(`${this.basePath}/${notificationId}`);
  }
  /** Get unread count. */
  async getUnreadCount() {
    return this.client.get(`${this.basePath}/unread-count`);
  }
  /** Get notification preferences. */
  async getPreferences() {
    return this.client.get(`${this.basePath}/preferences`);
  }
  /** Update notification preferences. */
  async updatePreferences(preferences) {
    return this.client.patch(`${this.basePath}/preferences`, preferences);
  }
};
function createNotificationsAPI(client) {
  return new NotificationsAPI(client);
}

// src/drm.ts
var DrmAPI = class {
  client;
  basePath = "/v1/drm";
  constructor(client) {
    this.client = client;
  }
  /** Create a DRM policy. */
  async createPolicy(request) {
    return this.client.post(`${this.basePath}/policies`, request);
  }
  /** Get a DRM policy by ID. */
  async getPolicy(policyId) {
    return this.client.get(`${this.basePath}/policies/${policyId}`);
  }
  /** List DRM policies. */
  async listPolicies(params) {
    return this.client.get(`${this.basePath}/policies`, {
      params
    });
  }
  /** Update a DRM policy. */
  async updatePolicy(policyId, updates) {
    return this.client.patch(`${this.basePath}/policies/${policyId}`, updates);
  }
  /** Delete a DRM policy. */
  async removePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  /** Get a DRM certificate for a provider. */
  async getCertificate(provider) {
    return this.client.get(`${this.basePath}/certificate/${provider}`);
  }
  /** Issue a license for an asset. */
  async issueLicense(assetId, policyId, deviceId) {
    return this.client.post(`${this.basePath}/license`, {
      asset_id: assetId,
      policy_id: policyId,
      device_id: deviceId
    });
  }
  /** Revoke a license. */
  async revokeLicense(licenseId) {
    return this.client.post(`${this.basePath}/license/${licenseId}/revoke`);
  }
  /** List licenses for an asset or user. */
  async listLicenses(params) {
    return this.client.get(`${this.basePath}/licenses`, {
      params
    });
  }
};
function createDrmAPI(client) {
  return new DrmAPI(client);
}

// src/index.ts
var Wave = class {
  client;
  // Existing (P3)
  clips;
  editor;
  voice;
  phone;
  collab;
  captions;
  chapters;
  studioAI;
  transcribe;
  sentiment;
  search;
  scene;
  // P1 - Core
  pipeline;
  studio;
  // P2 - Enterprise
  fleet;
  ghost;
  mesh;
  edge;
  pulse;
  prism;
  zoom;
  // P3 - Content & Commerce
  vault;
  marketplace;
  connect;
  distribution;
  desktop;
  signage;
  qr;
  audience;
  creator;
  // P4 - Specialized
  podcast;
  slides;
  usb;
  // Cross-cutting
  notifications;
  drm;
  constructor(config) {
    this.client = new WaveClient(config);
    this.clips = new ClipsAPI(this.client);
    this.editor = new EditorAPI(this.client);
    this.voice = new VoiceAPI(this.client);
    this.phone = new PhoneAPI(this.client);
    this.collab = new CollabAPI(this.client);
    this.captions = new CaptionsAPI(this.client);
    this.chapters = new ChaptersAPI(this.client);
    this.studioAI = new StudioAIAPI(this.client);
    this.transcribe = new TranscribeAPI(this.client);
    this.sentiment = new SentimentAPI(this.client);
    this.search = new SearchAPI(this.client);
    this.scene = new SceneAPI(this.client);
    this.pipeline = new PipelineAPI(this.client);
    this.studio = new StudioAPI(this.client);
    this.fleet = new FleetAPI(this.client);
    this.ghost = new GhostAPI(this.client);
    this.mesh = new MeshAPI(this.client);
    this.edge = new EdgeAPI(this.client);
    this.pulse = new PulseAPI(this.client);
    this.prism = new PrismAPI(this.client);
    this.zoom = new ZoomAPI(this.client);
    this.vault = new VaultAPI(this.client);
    this.marketplace = new MarketplaceAPI(this.client);
    this.connect = new ConnectAPI(this.client);
    this.distribution = new DistributionAPI(this.client);
    this.desktop = new DesktopAPI(this.client);
    this.signage = new SignageAPI(this.client);
    this.qr = new QrAPI(this.client);
    this.audience = new AudienceAPI(this.client);
    this.creator = new CreatorAPI(this.client);
    this.podcast = new PodcastAPI(this.client);
    this.slides = new SlidesAPI(this.client);
    this.usb = new UsbAPI(this.client);
    this.notifications = new NotificationsAPI(this.client);
    this.drm = new DrmAPI(this.client);
  }
};
function createWave(config) {
  return new Wave(config);
}
var index_default = Wave;
export {
  AudienceAPI,
  CaptionsAPI,
  ChaptersAPI,
  ClipsAPI,
  CollabAPI,
  ConnectAPI,
  CreatorAPI,
  DesktopAPI,
  DistributionAPI,
  DrmAPI,
  EdgeAPI,
  EditorAPI,
  FleetAPI,
  GhostAPI,
  MarketplaceAPI,
  MeshAPI,
  NotificationsAPI,
  PhoneAPI,
  PipelineAPI,
  PodcastAPI,
  PrismAPI,
  PulseAPI,
  QrAPI,
  RateLimitError,
  SceneAPI,
  SearchAPI,
  SentimentAPI,
  SignageAPI,
  SlidesAPI,
  StudioAIAPI,
  StudioAPI,
  TranscribeAPI,
  UsbAPI,
  VaultAPI,
  VoiceAPI,
  Wave,
  WaveClient,
  WaveError,
  ZoomAPI,
  createAudienceAPI,
  createCaptionsAPI,
  createChaptersAPI,
  createClient,
  createClipsAPI,
  createCollabAPI,
  createConnectAPI,
  createCreatorAPI,
  createDesktopAPI,
  createDistributionAPI,
  createDrmAPI,
  createEdgeAPI,
  createEditorAPI,
  createFleetAPI,
  createGhostAPI,
  createMarketplaceAPI,
  createMeshAPI,
  createNotificationsAPI,
  createPhoneAPI,
  createPipelineAPI,
  createPodcastAPI,
  createPrismAPI,
  createPulseAPI,
  createQrAPI,
  createSceneAPI,
  createSearchAPI,
  createSentimentAPI,
  createSignageAPI,
  createSlidesAPI,
  createStudioAIAPI,
  createStudioAPI,
  createTranscribeAPI,
  createUsbAPI,
  createVaultAPI,
  createVoiceAPI,
  createWave,
  createZoomAPI,
  index_default as default,
  initTelemetry,
  isTelemetryEnabled,
  resetTelemetry,
  withTelemetry,
  withTelemetrySync
};
