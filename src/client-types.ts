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
export interface RequestOptions extends RequestInit {
  /** Skip retry logic for this request */
  noRetry?: boolean;
  /** Custom timeout for this request */
  timeout?: number;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
}
export interface WaveAPIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id?: string;
}
export interface WaveClientEvents {
  'request.start': (url: string, method: string) => void;
  'request.success': (url: string, method: string, duration: number) => void;
  'request.error': (url: string, method: string, error: Error) => void;
  'request.retry': (url: string, method: string, attempt: number, delay: number) => void;
  'rate_limit.hit': (retryAfter: number) => void;
}
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  has_more: boolean;
  next_cursor?: string;
}
export type MediaType = 'video' | 'audio' | 'image';
export interface Timestamps {
  created_at: string;
  updated_at: string;
}
export type Metadata = Record<string, string | number | boolean>;
