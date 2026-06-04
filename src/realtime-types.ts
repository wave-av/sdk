/**
 * WAVE SDK - Realtime types
 *
 * Types for the WAVE Realtime control & event plane (realtime.wave.online): presence, pub/sub
 * broadcast, and the streaming-event bus that WAVE products push into.
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

export interface RealtimeConnectOptions {
  /** Member id to present as; defaults to the key prefix attributed server-side. */
  as?: string;
  /** Override the realtime base URL (default wss://realtime.wave.online). */
  url?: string;
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
