import { WaveClient } from './client.js';
import { CreateStreamRequest, Stream, UpdateStreamRequest, ListStreamsParams, StreamProtocol, StreamHealth, IngestEndpoint, StreamRecording, ViewerSession } from './pipeline-types.js';
export { StreamEvent, StreamQuality, StreamStatus } from './pipeline-types.js';
import { PaginatedResponse, PaginationParams } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

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
declare class PipelineAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a new stream
     *
     * Requires: streams:create permission
     */
    create(request: CreateStreamRequest): Promise<Stream>;
    /**
     * Get a stream by ID
     *
     * Requires: streams:read permission
     */
    get(streamId: string): Promise<Stream>;
    /**
     * Update a stream
     *
     * Requires: streams:update permission
     */
    update(streamId: string, request: UpdateStreamRequest): Promise<Stream>;
    /**
     * Remove a stream
     *
     * Requires: streams:remove permission (server-side RBAC enforced)
     */
    remove(streamId: string): Promise<void>;
    /**
     * List streams with optional filters
     *
     * Requires: streams:read permission
     */
    list(params?: ListStreamsParams): Promise<PaginatedResponse<Stream>>;
    /**
     * Start a stream
     *
     * Transitions the stream from idle to connecting. The stream will move
     * to "live" once media is received on the ingest endpoint.
     *
     * Requires: streams:start permission
     */
    start(streamId: string): Promise<Stream>;
    /**
     * Stop a stream
     *
     * Gracefully ends the stream. Any active recording will be finalized.
     *
     * Requires: streams:stop permission
     */
    stop(streamId: string): Promise<Stream>;
    /**
     * Switch the ingest protocol for a live stream
     *
     * Performs a zero-downtime protocol switch. The stream will briefly
     * enter "reconnecting" status during the transition.
     *
     * Requires: streams:update permission
     */
    switchProtocol(streamId: string, protocol: StreamProtocol): Promise<Stream>;
    /**
     * Get real-time health metrics for a stream
     *
     * Returns current bitrate, frame rate, latency, and overall health status.
     *
     * Requires: streams:read permission
     */
    getHealth(streamId: string): Promise<StreamHealth>;
    /**
     * Get ingest endpoints for a stream
     *
     * Returns primary and backup URLs for each configured protocol.
     *
     * Requires: streams:read permission
     */
    getIngestEndpoints(streamId: string): Promise<IngestEndpoint[]>;
    /**
     * Start recording a live stream
     *
     * Begins capturing the stream to a file. The stream must be in "live" status.
     *
     * Requires: streams:record permission
     */
    startRecording(streamId: string): Promise<StreamRecording>;
    /**
     * Stop recording a live stream
     *
     * Finalizes the current recording. The recording enters "processing" status
     * while it is being packaged.
     *
     * Requires: streams:record permission
     */
    stopRecording(streamId: string): Promise<StreamRecording>;
    /**
     * List recordings for a stream
     *
     * Requires: streams:read permission
     */
    listRecordings(streamId: string, params?: PaginationParams): Promise<PaginatedResponse<StreamRecording>>;
    /**
     * Get a specific recording
     *
     * Requires: streams:read permission
     */
    getRecording(streamId: string, recordingId: string): Promise<StreamRecording>;
    /**
     * List active viewer sessions for a stream
     *
     * Requires: streams:read permission
     */
    listViewers(streamId: string, params?: PaginationParams): Promise<PaginatedResponse<ViewerSession>>;
    /**
     * Get current and peak viewer count for a stream
     *
     * Requires: streams:read permission
     */
    getViewerCount(streamId: string): Promise<{
        count: number;
        peak: number;
    }>;
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
    waitForLive(streamId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (stream: Stream) => void;
    }): Promise<Stream>;
}
/**
 * Create a Pipeline API instance
 */
declare function createPipelineAPI(client: WaveClient): PipelineAPI;

export { CreateStreamRequest, IngestEndpoint, ListStreamsParams, PipelineAPI, Stream, StreamHealth, StreamProtocol, StreamRecording, UpdateStreamRequest, ViewerSession, createPipelineAPI };
