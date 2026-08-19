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

// src/client.ts
var client_exports = {};
__export(client_exports, {
  RateLimitError: () => RateLimitError,
  WaveClient: () => WaveClient,
  WaveError: () => WaveError,
  createClient: () => createClient
});
module.exports = __toCommonJS(client_exports);
var import_eventemitter3 = require("eventemitter3");

// src/telemetry.ts
var resolvedTracer = null;
var telemetryEnabled = false;
function initTelemetry(config) {
  if (!config.enabled) {
    telemetryEnabled = false;
    resolvedTracer = null;
    return;
  }
  try {
    const otelApi = require("@opentelemetry/api");
    const serviceName = config.serviceName ?? "@wave/sdk";
    resolvedTracer = otelApi.trace.getTracer(serviceName, "2.0.0");
    telemetryEnabled = true;
  } catch {
    telemetryEnabled = false;
    resolvedTracer = null;
  }
}

// src/client.ts
var RETRYABLE_ERROR_CODES = /* @__PURE__ */ new Set([
  "RATE_LIMITED",
  "TIMEOUT",
  "NETWORK_ERROR",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR"
]);
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
  /**
   * Determine whether an error is safe to retry.
   *
   * Conservative by design: only transient, server-side or throttling
   * conditions are retryable. Client errors (4xx other than 408/429) are
   * treated as permanent so we never re-issue a request the server has
   * already rejected on its merits (e.g. 400/401/403/404).
   */
  isRetryable(statusCode, code) {
    if (statusCode >= 500) {
      return true;
    }
    if (statusCode === 429 || statusCode === 408) {
      return true;
    }
    if (statusCode === 0) {
      return true;
    }
    if (RETRYABLE_ERROR_CODES.has(code)) {
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
var WaveClient = class extends import_eventemitter3.EventEmitter {
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
  /**
   * Connection info for transports that bypass the HTTP client (e.g. the Realtime WebSocket plane,
   * which can't route each frame through request()). Exposes the caller's own API key + base URL.
   */
  getConnectionInfo() {
    return {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      organizationId: this.config.organizationId || void 0
    };
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
   * Parse an error response body into a WaveError (or subclass).
   *
   * Reads the JSON error envelope (see WaveAPIErrorResponse) when present and
   * tolerates non-JSON / empty bodies, falling back to the HTTP status text.
   * The returned error's `retryable` flag is derived from status + code via
   * WaveError's own logic, so callers can branch on `error.retryable`.
   */
  async parseErrorResponse(response) {
    const statusCode = response.status;
    const requestId = response.headers.get("x-request-id") || void 0;
    let code = `HTTP_${statusCode}`;
    let message = response.statusText || `Request failed with status ${statusCode}`;
    let details;
    let bodyRequestId;
    try {
      const body = await response.json();
      if (body && typeof body === "object" && body.error) {
        code = body.error.code || code;
        message = body.error.message || message;
        details = body.error.details;
      }
      bodyRequestId = body?.request_id;
    } catch {
    }
    return new WaveError(message, code, statusCode, requestId ?? bodyRequestId, details);
  }
  /**
   * Parse the `Retry-After` response header into a delay in **milliseconds**
   * (the unit expected by `sleep()` and produced by `calculateBackoff()`).
   *
   * Supports both forms defined by RFC 7231:
   *   - delta-seconds (e.g. `Retry-After: 120`)
   *   - HTTP-date     (e.g. `Retry-After: Wed, 21 Oct 2025 07:28:00 GMT`)
   *
   * Falls back to the base backoff delay (1000ms) when the header is missing
   * or malformed.
   */
  parseRetryAfter(response) {
    const defaultDelayMs = 1e3;
    const header = response.headers.get("retry-after");
    if (!header) {
      return defaultDelayMs;
    }
    const trimmed = header.trim();
    if (/^\d+$/.test(trimmed)) {
      const seconds = Number(trimmed);
      if (Number.isFinite(seconds)) {
        return seconds * 1e3;
      }
    }
    const dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) {
      return Math.max(0, dateMs - Date.now());
    }
    return defaultDelayMs;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RateLimitError,
  WaveClient,
  WaveError,
  createClient
});
