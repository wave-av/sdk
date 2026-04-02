export type StreamStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "ending"
  | "ended"
  | "failed";
export type StreamProtocol = "webrtc" | "srt" | "rtmp" | "hls" | "ndi" | "omt";
export type StreamQuality = "source" | "4k" | "1080p" | "720p" | "480p" | "360p";
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
export interface StreamEvent {
  /** Event type */
  type:
    | "stream.started"
    | "stream.ended"
    | "viewer.joined"
    | "viewer.left"
    | "health.degraded"
    | "recording.ready";
  /** Stream this event relates to */
  stream_id: string;
  /** ISO 8601 timestamp when the event occurred */
  timestamp: string;
  /** Event-specific payload */
  data?: Record<string, unknown>;
}
