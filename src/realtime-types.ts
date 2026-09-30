/**
 * WAVE SDK - Realtime types
 *
 * Types for the WAVE Realtime control & event plane (served by the gateway at
 * `https://api.wave.online/v1/realtime`): presence, pub/sub broadcast, and the streaming-event bus
 * that WAVE products push into.
 */

/** Canonical WAVE event names producers push into a channel (open union — custom events allowed). */
export type WaveRealtimeEventName =
  | 'transcription.partial'
  | 'transcription.final'
  | 'caption.cue'
  | 'sentiment.tick'
  | 'clip.created'
  | 'stream.started'
  | 'stream.viewer_count'
  | 'stream.ended'
  | (string & {});

/** A frame received from the server over the WebSocket. */
export interface RealtimeFrame {
  type: 'welcome' | 'message' | 'join' | 'leave' | 'presence' | 'pong' | 'error';
  channel?: string;
  event?: WaveRealtimeEventName;
  data?: unknown;
  member?: string;
  from?: string;
  ts?: number;
  members?: PresenceMember[];
  history?: RealtimeFrame[];
  detail?: string;
}

export interface PresenceMember {
  id: string;
  meta?: Record<string, unknown>;
}

/**
 * Opens the realtime WebSocket. The gateway authenticates the upgrade by the `Authorization`
 * header only, so the factory must send `headers` on the handshake. Supply one when the runtime's
 * global WebSocket cannot set request headers (browsers, Node < 22), e.g. with the `ws` package:
 * `(url, headers) => new WS(url, { headers })`.
 */
export type RealtimeSocketFactory = (url: string, headers: Record<string, string>) => WebSocket;

export interface RealtimeConnectOptions {
  /** Member id to present as; defaults to the key prefix attributed server-side. */
  as?: string;
  /**
   * Override the realtime WebSocket base, e.g. `wss://api.wave.online/v1/realtime`. Defaults to the
   * client's `baseUrl` + `/v1/realtime`, with `https` mapped to `wss`.
   */
  url?: string;
  /** Custom WebSocket constructor (see RealtimeSocketFactory). */
  webSocketFactory?: RealtimeSocketFactory;
  /** Auto-reconnect with backoff on unexpected close (default true). */
  reconnect?: boolean;
  /** Max reconnect backoff in ms (default 15000). */
  maxBackoffMs?: number;
}

/** Strongly-typed listener map for a RealtimeChannel (in addition to per-event-name listeners). */
export interface RealtimeChannelEvents {
  open: () => void;
  close: (info: { code: number; reason: string }) => void;
  error: (err: Error) => void;
  message: (frame: RealtimeFrame) => void;
  presence: (members: PresenceMember[]) => void;
  join: (member: string) => void;
  leave: (member: string) => void;
}
