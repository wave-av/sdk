/**
 * WAVE SDK - Base API Client
 *
 * Core HTTP client with authentication, rate limiting, and retry logic.
 */

import { EventEmitter } from 'eventemitter3';
import type { TelemetryConfig } from './telemetry';
import { initTelemetry } from './telemetry';
import type {
  WaveClientConfig,
  RequestOptions,
  WaveClientEvents,
  WaveAPIErrorResponse,
} from './client-types';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * SDK configuration options
 */

/**
 * Request options for individual API calls
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error response structure
 */

/**
 * WAVE SDK Error class
 */
export class WaveError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    requestId?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WaveError';
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
  private isRetryable(statusCode: number, code: string): boolean {
    // Server errors are transient and retryable.
    if (statusCode >= 500) {
      return true;
    }

    // Throttling (429) and request timeout (408) are retryable.
    if (statusCode === 429 || statusCode === 408) {
      return true;
    }

    // statusCode 0 indicates a network/transport-level failure (no HTTP
    // response was received) — these are retryable.
    if (statusCode === 0) {
      return true;
    }

    // Code-based retryable signals for transport/throttling conditions that
    // may surface without a conventional retryable status code.
    const retryableCodes = new Set([
      'RATE_LIMITED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_ERROR',
    ]);
    if (retryableCodes.has(code)) {
      return true;
    }

    return false;
  }

}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends WaveError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, requestId?: string) {
    super(message, 'RATE_LIMITED', 429, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ============================================================================
// Event Types
// ============================================================================

// ============================================================================
// Base Client Implementation
// ============================================================================

/**
 * WAVE API Base Client
 */
export class WaveClient extends EventEmitter<WaveClientEvents> {
  protected readonly config: Required<Omit<WaveClientConfig, 'customHeaders' | 'telemetry'>> & {
    customHeaders: Record<string, string>;
    telemetry?: TelemetryConfig;
  };

  constructor(config: WaveClientConfig) {
    super();

    if (!config.apiKey) {
      throw new Error('WAVE SDK: apiKey is required');
    }

    this.config = {
      apiKey: config.apiKey,
      organizationId: config.organizationId || '',
      baseUrl: config.baseUrl || 'https://api.wave.online',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries ?? 3,
      debug: config.debug || false,
      customHeaders: config.customHeaders || {},
      telemetry: config.telemetry,
    };

    // Initialize telemetry if configured (opt-in only)
    if (config.telemetry) {
      initTelemetry(config.telemetry);
    }
  }

  /**
   * Connection info for transports that bypass the HTTP client (e.g. the Realtime WebSocket plane,
   * which can't route each frame through request()). Exposes the caller's own API key + base URL.
   */
  public getConnectionInfo(): { apiKey: string; baseUrl: string; organizationId?: string } {
    return {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      organizationId: this.config.organizationId || undefined,
    };
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  // ==========================================================================
  // Core Request Logic
  // ==========================================================================

  /**
   * Make an API request with retry logic
   */
  protected async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, noRetry, timeout: requestTimeout, ...fetchOptions } = options;

    // Build URL with query parameters
    let url = `${this.config.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Execute with retries
    return this.executeWithRetry<T>(
      url,
      {
        ...fetchOptions,
        headers: this.buildHeaders(fetchOptions.headers),
      },
      noRetry ? 0 : this.config.maxRetries,
      requestTimeout || this.config.timeout
    );
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    maxRetries: number,
    timeout: number
  ): Promise<T> {
    const method = options.method || 'GET';
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.emit('request.start', url, method);
        const startTime = Date.now();

        const response = await this.fetchWithTimeout(url, options, timeout);
        const duration = Date.now() - startTime;

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response);
          this.emit('rate_limit.hit', retryAfter);

          if (attempt < maxRetries) {
            this.emit('request.retry', url, method, attempt + 1, retryAfter);
            await this.sleep(retryAfter);
            continue;
          }

          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter,
            response.headers.get('x-request-id') || undefined
          );
        }

        // Handle non-OK responses
        if (!response.ok) {
          const error = await this.parseErrorResponse(response);

          if (error.retryable && attempt < maxRetries) {
            const delay = this.calculateBackoff(attempt);
            this.emit('request.retry', url, method, attempt + 1, delay);
            await this.sleep(delay);
            continue;
          }

          throw error;
        }

        this.emit('request.success', url, method, duration);

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return response.json() as Promise<T>;
        }

        // Return empty object for non-JSON responses
        return {} as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's a non-retryable WaveError
        if (error instanceof WaveError && !error.retryable) {
          throw error;
        }

        // Network errors are retryable
        if (
          error instanceof TypeError ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          if (attempt < maxRetries) {
            const delay = this.calculateBackoff(attempt);
            this.emit('request.retry', url, method, attempt + 1, delay);
            await this.sleep(delay);
            continue;
          }
        }

        this.emit('request.error', url, method, error as Error);
      }
    }

    throw (
      lastError ||
      new WaveError('Request failed after retries', 'UNKNOWN_ERROR', 0)
    );
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    additionalHeaders?: HeadersInit
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `wave-sdk-typescript/1.0.0`,
      ...this.config.customHeaders,
    };

    if (this.config.organizationId) {
      headers['X-Organization-Id'] = this.config.organizationId;
    }

    // Merge additional headers
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
  private async parseErrorResponse(response: Response): Promise<WaveError> {
    const statusCode = response.status;
    const requestId = response.headers.get('x-request-id') || undefined;

    let code = `HTTP_${statusCode}`;
    let message = response.statusText || `Request failed with status ${statusCode}`;
    let details: Record<string, unknown> | undefined;
    let bodyRequestId: string | undefined;

    try {
      const body = (await response.json()) as Partial<WaveAPIErrorResponse>;
      if (body && typeof body === 'object' && body.error) {
        code = body.error.code || code;
        message = body.error.message || message;
        details = body.error.details;
      }
      bodyRequestId = body?.request_id;
    } catch {
      // Non-JSON or empty body — keep status-derived defaults.
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
  private parseRetryAfter(response: Response): number {
    const defaultDelayMs = 1000;
    const header = response.headers.get('retry-after');
    if (!header) {
      return defaultDelayMs;
    }

    // delta-seconds form: a non-negative integer number of seconds.
    const seconds = Number(header);
    if (Number.isFinite(seconds)) {
      return Math.max(0, seconds) * 1000;
    }

    // HTTP-date form: convert the absolute time to a delay from now.
    const dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) {
      return Math.max(0, dateMs - Date.now());
    }

    return defaultDelayMs;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (0-25% of delay)
    return delay + Math.random() * delay * 0.25;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Debugging
  // ==========================================================================

  /**
   * Log debug message
   */
  protected log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[WaveSDK] ${message}`, ...args);
    }
  }
}

/**
 * Create a new WAVE client instance
 */
export function createClient(config: WaveClientConfig): WaveClient {
  return new WaveClient(config);
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Standard pagination parameters
 */

/**
 * Standard paginated response
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Media types supported by WAVE
 */

/**
 * Standard timestamp fields
 */

/**
 * Standard metadata object
 */
