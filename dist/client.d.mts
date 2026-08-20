import { EventEmitter } from 'eventemitter3';
import { TelemetryConfig } from './telemetry.mjs';
import { WaveClientEvents, WaveClientConfig, RequestOptions } from './client-types.mjs';
export { MediaType, Metadata, PaginatedResponse, PaginationParams, Timestamps, WaveAPIErrorResponse } from './client-types.mjs';

/**
 * WAVE SDK - Base API Client
 *
 * Core HTTP client with authentication, rate limiting, and retry logic.
 */

/**
 * SDK configuration options
 */
/**
 * Request options for individual API calls
 */
/**
 * API error response structure
 */
/**
 * WAVE SDK Error class
 */
declare class WaveError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly requestId?: string;
    readonly details?: Record<string, unknown>;
    readonly retryable: boolean;
    constructor(message: string, code: string, statusCode: number, requestId?: string, details?: Record<string, unknown>);
    /**
     * Determine whether an error is safe to retry.
     *
     * Conservative by design: only transient, server-side or throttling
     * conditions are retryable. Client errors (4xx other than 408/429) are
     * treated as permanent so we never re-issue a request the server has
     * already rejected on its merits (e.g. 400/401/403/404).
     */
    private isRetryable;
}
/**
 * Rate limit error with retry information
 */
declare class RateLimitError extends WaveError {
    readonly retryAfter: number;
    constructor(message: string, retryAfter: number, requestId?: string);
}
/**
 * WAVE API Base Client
 */
declare class WaveClient extends EventEmitter<WaveClientEvents> {
    protected readonly config: Required<Omit<WaveClientConfig, 'customHeaders' | 'telemetry'>> & {
        customHeaders: Record<string, string>;
        telemetry?: TelemetryConfig;
    };
    constructor(config: WaveClientConfig);
    /**
     * Connection info for transports that bypass the HTTP client (e.g. the Realtime WebSocket plane,
     * which can't route each frame through request()). Exposes the caller's own API key + base URL.
     */
    getConnectionInfo(): {
        apiKey: string;
        baseUrl: string;
        organizationId?: string;
    };
    /**
     * Make a GET request
     */
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make a POST request
     */
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a PUT request
     */
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a PATCH request
     */
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a DELETE request
     */
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make an API request with retry logic
     */
    protected request<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Execute request with exponential backoff retry
     */
    private executeWithRetry;
    /**
     * Fetch with timeout
     */
    private fetchWithTimeout;
    /**
     * Build request headers
     */
    private buildHeaders;
    /**
     * Parse an error response body into a WaveError (or subclass).
     *
     * Reads the JSON error envelope (see WaveAPIErrorResponse) when present and
     * tolerates non-JSON / empty bodies, falling back to the HTTP status text.
     * The returned error's `retryable` flag is derived from status + code via
     * WaveError's own logic, so callers can branch on `error.retryable`.
     */
    private parseErrorResponse;
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
    private parseRetryAfter;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Log debug message
     */
    protected log(message: string, ...args: unknown[]): void;
}
/**
 * Create a new WAVE client instance
 */
declare function createClient(config: WaveClientConfig): WaveClient;

export { RateLimitError, RequestOptions, WaveClient, WaveClientConfig, WaveClientEvents, WaveError, createClient };
