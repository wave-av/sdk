/**
 * WAVE SDK - Base API Client
 *
 * Core HTTP client with authentication, rate limiting, and retry logic.
 */
import { EventEmitter } from 'eventemitter3';
import type { TelemetryConfig } from './telemetry';
/**
 * SDK configuration options
 */
export interface WaveClientConfig {
    /** API key for authentication */
    apiKey: string;
    /** Organization ID for tenant isolation */
    organizationId?: string;
    /** Base URL for the API (default: https://api.wave.online) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Maximum retry attempts for failed requests (default: 3) */
    maxRetries?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom headers to include in all requests */
    customHeaders?: Record<string, string>;
    /** Optional telemetry configuration for OpenTelemetry integration */
    telemetry?: TelemetryConfig;
}
/**
 * Request options for individual API calls
 */
export interface RequestOptions extends RequestInit {
    /** Skip retry logic for this request */
    noRetry?: boolean;
    /** Custom timeout for this request */
    timeout?: number;
    /** Query parameters */
    params?: Record<string, string | number | boolean | undefined>;
}
/**
 * API error response structure
 */
export interface WaveAPIErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    request_id?: string;
}
/**
 * WAVE SDK Error class
 */
export declare class WaveError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly requestId?: string;
    readonly details?: Record<string, unknown>;
    readonly retryable: boolean;
    constructor(message: string, code: string, statusCode: number, requestId?: string, details?: Record<string, unknown>);
    private isRetryable;
}
/**
 * Rate limit error with retry information
 */
export declare class RateLimitError extends WaveError {
    readonly retryAfter: number;
    constructor(message: string, retryAfter: number, requestId?: string);
}
export interface WaveClientEvents {
    'request.start': (url: string, method: string) => void;
    'request.success': (url: string, method: string, duration: number) => void;
    'request.error': (url: string, method: string, error: Error) => void;
    'request.retry': (url: string, method: string, attempt: number, delay: number) => void;
    'rate_limit.hit': (retryAfter: number) => void;
}
/**
 * WAVE API Base Client
 *
 * Handles authentication, rate limiting, and retry logic for all API requests.
 *
 * @example
 * ```typescript
 * const client = new WaveClient({
 *   apiKey: process.env.WAVE_API_KEY!,
 *   organizationId: 'org_123',
 * });
 *
 * // Make a request
 * const response = await client.get('/v1/clips');
 * ```
 */
export declare class WaveClient extends EventEmitter<WaveClientEvents> {
    protected readonly config: Required<Omit<WaveClientConfig, 'customHeaders' | 'telemetry'>> & {
        customHeaders: Record<string, string>;
        telemetry?: TelemetryConfig;
    };
    constructor(config: WaveClientConfig);
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
     * Parse error response
     */
    private parseErrorResponse;
    /**
     * Parse Retry-After header
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
export declare function createClient(config: WaveClientConfig): WaveClient;
/**
 * Standard pagination parameters
 */
export interface PaginationParams {
    limit?: number;
    offset?: number;
    cursor?: string;
}
/**
 * Standard paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    has_more: boolean;
    next_cursor?: string;
}
/**
 * Media types supported by WAVE
 */
export type MediaType = 'video' | 'audio' | 'image';
/**
 * Standard timestamp fields
 */
export interface Timestamps {
    created_at: string;
    updated_at: string;
}
/**
 * Standard metadata object
 */
export type Metadata = Record<string, string | number | boolean>;
