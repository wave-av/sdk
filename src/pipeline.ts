/**
 * WAVE SDK - Pipeline API
 *
 * Manage live streams across protocols (WebRTC, SRT, RTMP, HLS, NDI, OMT).
 * The Pipeline is WAVE's core streaming engine for ingesting, transcoding,
 * and delivering live video at scale.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from "./client";
import type { StreamStatus, StreamProtocol, StreamQuality, Stream, CreateStreamRequest, UpdateStreamRequest, ListStreamsParams, StreamHealth, StreamRecording, IngestEndpoint, ViewerSession, StreamEvent } from './pipeline-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Stream lifecycle status
 */

/**
 * Supported streaming protocols
 */

/**
 * Stream quality presets
 */

/**
 * Live stream object
 */

/**
 * Request body to create a new stream
 */

/**
 * Request body to update an existing stream
 */

/**
 * Query parameters for listing streams
 */

/**
 * Real-time health metrics for a live stream
 */

/**
 * A recording created from a live stream
 */

/**
 * Ingest endpoint details for a stream
 */

/**
 * A single viewer session on a stream
 */

/**
 * A stream lifecycle or health event
 */

// ============================================================================
// Pipeline API
// ============================================================================

/**
 * Pipeline API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { PipelineAPI } from '@wave/sdk/pipeline';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const pipeline = new PipelineAPI(client);
 *
 * // Create a stream
 * const stream = await pipeline.create({
 *   title: 'My Live Stream',
 *   protocol: 'webrtc',
 *   recording_enabled: true,
 * });
 *
 * // Start and wait for live
 * await pipeline.start(stream.id);
 * const live = await pipeline.waitForLive(stream.id);
 * console.log('Stream is live:', live.playback_url);
 *
 * // Monitor health
 * const health = await pipeline.getHealth(stream.id);
 * console.log('Stream health:', health.status);
 * ```
 */
export class PipelineAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/streams";

  constructor(client: WaveClient) {
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
  async create(request: CreateStreamRequest): Promise<Stream> {
    return this.client.post<Stream>(this.basePath, request);
  }

  /**
   * Get a stream by ID
   *
   * Requires: streams:read permission
   */
  async get(streamId: string): Promise<Stream> {
    return this.client.get<Stream>(`${this.basePath}/${streamId}`);
  }

  /**
   * Update a stream
   *
   * Requires: streams:update permission
   */
  async update(streamId: string, request: UpdateStreamRequest): Promise<Stream> {
    return this.client.patch<Stream>(`${this.basePath}/${streamId}`, request);
  }

  /**
   * Remove a stream
   *
   * Requires: streams:remove permission (server-side RBAC enforced)
   */
  async remove(streamId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${streamId}`);
  }

  /**
   * List streams with optional filters
   *
   * Requires: streams:read permission
   */
  async list(params?: ListStreamsParams): Promise<PaginatedResponse<Stream>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      protocol: params?.protocol,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order,
    };

    return this.client.get<PaginatedResponse<Stream>>(this.basePath, {
      params: queryParams,
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
  async start(streamId: string): Promise<Stream> {
    return this.client.post<Stream>(`${this.basePath}/${streamId}/start`);
  }

  /**
   * Stop a stream
   *
   * Gracefully ends the stream. Any active recording will be finalized.
   *
   * Requires: streams:stop permission
   */
  async stop(streamId: string): Promise<Stream> {
    return this.client.post<Stream>(`${this.basePath}/${streamId}/stop`);
  }

  /**
   * Switch the ingest protocol for a live stream
   *
   * Performs a zero-downtime protocol switch. The stream will briefly
   * enter "reconnecting" status during the transition.
   *
   * Requires: streams:update permission
   */
  async switchProtocol(streamId: string, protocol: StreamProtocol): Promise<Stream> {
    return this.client.post<Stream>(`${this.basePath}/${streamId}/switch-protocol`, { protocol });
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
  async getHealth(streamId: string): Promise<StreamHealth> {
    return this.client.get<StreamHealth>(`${this.basePath}/${streamId}/health`);
  }

  /**
   * Get ingest endpoints for a stream
   *
   * Returns primary and backup URLs for each configured protocol.
   *
   * Requires: streams:read permission
   */
  async getIngestEndpoints(streamId: string): Promise<IngestEndpoint[]> {
    return this.client.get<IngestEndpoint[]>(`${this.basePath}/${streamId}/ingest-endpoints`);
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
  async startRecording(streamId: string): Promise<StreamRecording> {
    return this.client.post<StreamRecording>(`${this.basePath}/${streamId}/recordings/start`);
  }

  /**
   * Stop recording a live stream
   *
   * Finalizes the current recording. The recording enters "processing" status
   * while it is being packaged.
   *
   * Requires: streams:record permission
   */
  async stopRecording(streamId: string): Promise<StreamRecording> {
    return this.client.post<StreamRecording>(`${this.basePath}/${streamId}/recordings/stop`);
  }

  /**
   * List recordings for a stream
   *
   * Requires: streams:read permission
   */
  async listRecordings(
    streamId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<StreamRecording>> {
    return this.client.get<PaginatedResponse<StreamRecording>>(
      `${this.basePath}/${streamId}/recordings`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }

  /**
   * Get a specific recording
   *
   * Requires: streams:read permission
   */
  async getRecording(streamId: string, recordingId: string): Promise<StreamRecording> {
    return this.client.get<StreamRecording>(
      `${this.basePath}/${streamId}/recordings/${recordingId}`,
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
  async listViewers(
    streamId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ViewerSession>> {
    return this.client.get<PaginatedResponse<ViewerSession>>(
      `${this.basePath}/${streamId}/viewers`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }

  /**
   * Get current and peak viewer count for a stream
   *
   * Requires: streams:read permission
   */
  async getViewerCount(streamId: string): Promise<{ count: number; peak: number }> {
    return this.client.get<{ count: number; peak: number }>(
      `${this.basePath}/${streamId}/viewers/count`,
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
  async waitForLive(
    streamId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (stream: Stream) => void;
    },
  ): Promise<Stream> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 120000; // 2 minutes default
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
}

/**
 * Create a Pipeline API instance
 */
export function createPipelineAPI(client: WaveClient): PipelineAPI {
  return new PipelineAPI(client);
}
