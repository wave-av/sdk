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
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from "./client";
/**
 * Stream lifecycle status
 */
export type StreamStatus = "idle" | "connecting" | "live" | "reconnecting" | "ending" | "ended" | "failed";
/**
 * Supported streaming protocols
 */
export type StreamProtocol = "webrtc" | "srt" | "rtmp" | "hls" | "ndi" | "omt";
/**
 * Stream quality presets
 */
export type StreamQuality = "source" | "4k" | "1080p" | "720p" | "480p" | "360p";
/**
 * Live stream object
 */
export interface Stream extends Timestamps {
    /** Unique stream identifier */
    id: string;
    /** Organization that owns the stream */
    organization_id: string;
    /** Human-readable stream title */
    title: string;
    /** Optional description */
    description?: string;
    /** Current lifecycle status */
    status: StreamStatus;
    /** Ingest protocol */
    protocol: StreamProtocol;
    /** URL to push media to */
    ingest_url?: string;
    /** URL for viewers to watch */
    playback_url?: string;
    /** Secret key for stream authentication */
    stream_key?: string;
    /** Video resolution (e.g., "1920x1080") */
    resolution?: string;
    /** Video frame rate in fps */
    frame_rate?: number;
    /** Video bitrate in kilobits per second */
    bitrate_kbps?: number;
    /** Current number of connected viewers */
    viewer_count: number;
    /** Whether recording is enabled */
    recording_enabled: boolean;
    /** Whether DVR (rewind during live) is enabled */
    dvr_enabled: boolean;
    /** Whether low-latency mode is active */
    low_latency: boolean;
    /** Maximum allowed stream duration in seconds */
    max_duration_seconds?: number;
    /** ISO 8601 timestamp when the stream went live */
    started_at?: string;
    /** ISO 8601 timestamp when the stream ended */
    ended_at?: string;
    /** Categorization tags */
    tags?: string[];
    /** Arbitrary key-value metadata */
    metadata?: Metadata;
}
/**
 * Request body to create a new stream
 */
export interface CreateStreamRequest {
    /** Human-readable stream title */
    title: string;
    /** Optional description */
    description?: string;
    /** Ingest protocol (default: webrtc) */
    protocol?: StreamProtocol;
    /** Quality preset for transcoding */
    quality?: StreamQuality;
    /** Enable recording of the stream */
    recording_enabled?: boolean;
    /** Enable DVR (rewind during live) */
    dvr_enabled?: boolean;
    /** Enable low-latency mode */
    low_latency?: boolean;
    /** Maximum allowed duration in seconds */
    max_duration_seconds?: number;
    /** Preferred ingest region (e.g., "us-east-1") */
    region?: string;
    /** Categorization tags */
    tags?: string[];
    /** Arbitrary key-value metadata */
    metadata?: Metadata;
    /** Webhook URL for stream lifecycle events */
    webhook_url?: string;
}
/**
 * Request body to update an existing stream
 */
export interface UpdateStreamRequest {
    /** Updated title */
    title?: string;
    /** Updated description */
    description?: string;
    /** Toggle recording */
    recording_enabled?: boolean;
    /** Toggle DVR */
    dvr_enabled?: boolean;
    /** Toggle low-latency mode */
    low_latency?: boolean;
    /** Update metadata */
    metadata?: Metadata;
    /** Update tags */
    tags?: string[];
}
/**
 * Query parameters for listing streams
 */
export interface ListStreamsParams extends PaginationParams {
    /** Filter by stream status */
    status?: StreamStatus;
    /** Filter by ingest protocol */
    protocol?: StreamProtocol;
    /** Filter streams created after this ISO 8601 timestamp */
    created_after?: string;
    /** Filter streams created before this ISO 8601 timestamp */
    created_before?: string;
    /** Field to order results by */
    order_by?: "created_at" | "started_at" | "viewer_count" | "title";
    /** Sort direction */
    order?: "asc" | "desc";
}
/**
 * Real-time health metrics for a live stream
 */
export interface StreamHealth {
    /** Stream this health report belongs to */
    stream_id: string;
    /** Overall health assessment */
    status: "healthy" | "degraded" | "critical";
    /** Current video bitrate in kbps */
    bitrate_kbps: number;
    /** Current frame rate in fps */
    frame_rate: number;
    /** Number of dropped frames since stream start */
    dropped_frames: number;
    /** End-to-end latency in milliseconds */
    latency_ms: number;
    /** Current viewer count */
    viewer_count: number;
    /** Seconds since the stream went live */
    uptime_seconds: number;
    /** ISO 8601 timestamp of the last received keyframe */
    last_keyframe_at?: string;
    /** Encoder software/hardware info reported by the source */
    encoder_info?: string;
}
/**
 * A recording created from a live stream
 */
export interface StreamRecording extends Timestamps {
    /** Unique recording identifier */
    id: string;
    /** Stream this recording was captured from */
    stream_id: string;
    /** Recording pipeline status */
    status: "recording" | "processing" | "ready" | "failed";
    /** Duration in seconds */
    duration?: number;
    /** File size in bytes */
    file_size?: number;
    /** URL to download the recording file */
    download_url?: string;
    /** URL for playback */
    playback_url?: string;
    /** Container format (e.g., "mp4", "ts") */
    format?: string;
}
/**
 * Ingest endpoint details for a stream
 */
export interface IngestEndpoint {
    /** Protocol for this endpoint */
    protocol: StreamProtocol;
    /** Primary ingest URL */
    url: string;
    /** Stream key for authentication */
    stream_key: string;
    /** Region where this endpoint is located */
    region: string;
    /** Backup ingest URL for failover */
    backup_url?: string;
}
/**
 * A single viewer session on a stream
 */
export interface ViewerSession {
    /** Unique session identifier */
    id: string;
    /** Stream being watched */
    stream_id: string;
    /** Viewer's user or anonymous identifier */
    viewer_id: string;
    /** Playback protocol the viewer is using */
    protocol: StreamProtocol;
    /** Quality level the viewer is receiving */
    quality: StreamQuality;
    /** ISO 8601 timestamp when the viewer joined */
    started_at: string;
    /** Duration the viewer has been watching in seconds */
    duration: number;
    /** Viewer's geographic region */
    region?: string;
    /** Device type (e.g., "desktop", "mobile", "tv") */
    device_type?: string;
    /** Number of buffering events during this session */
    buffering_events: number;
}
/**
 * A stream lifecycle or health event
 */
export interface StreamEvent {
    /** Event type */
    type: "stream.started" | "stream.ended" | "viewer.joined" | "viewer.left" | "health.degraded" | "recording.ready";
    /** Stream this event relates to */
    stream_id: string;
    /** ISO 8601 timestamp when the event occurred */
    timestamp: string;
    /** Event-specific payload */
    data?: Record<string, unknown>;
}
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
export declare class PipelineAPI {
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
export declare function createPipelineAPI(client: WaveClient): PipelineAPI;
