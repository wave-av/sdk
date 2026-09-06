import { EventEmitter } from 'eventemitter3';
import { WaveClient } from './client.js';
import { RealtimeConnectOptions, PresenceMember, RealtimeFrame } from './realtime-types.js';
export { RealtimeChannelEvents, WaveRealtimeEventName } from './realtime-types.js';
import './telemetry.js';
import './client-types.js';

/**
 * WAVE SDK - Realtime API
 *
 * The WAVE Realtime control & event plane (realtime.wave.online): presence, pub/sub broadcast, and the
 * streaming-event bus the WAVE AI products push into. Subscribe once to a channel and receive live
 * transcription / captions / sentiment / clip / stream events with no polling.
 *
 * NOTE: This is a client SDK. Auth, scope, entitlement, and metering are enforced server-side (the
 * gateway, via realtime's /v1/verify federation) — the SDK only forwards your API key.
 */

/**
 * One subscribed channel = one WebSocket. Emits lifecycle events ('open'|'close'|'error'|'message'|
 * 'presence'|'join'|'leave') AND a typed event per WAVE event name (e.g. `.on('caption.cue', cb)`).
 */
declare class RealtimeChannel extends EventEmitter {
    readonly channel: string;
    private readonly apiKey;
    private readonly opts;
    private ws;
    private closedByUser;
    private attempt;
    private readonly wsBase;
    private readonly httpBase;
    constructor(channel: string, apiKey: string, opts?: RealtimeConnectOptions);
    private url;
    private open;
    private scheduleReconnect;
    /** Publish an event to this channel over the socket (fire-and-forget). */
    send(event: string, data?: unknown): void;
    /** Request the current presence list (arrives as a 'presence' event). */
    requestPresence(): void;
    /** Close the socket and stop reconnecting. */
    close(): void;
}
/**
 * Realtime entry point. `wave.realtime.connect('stream:abc').on('transcription.partial', …)`.
 * Presence/history/publish are also available as one-shot REST calls (no socket needed) for producers.
 */
declare class RealtimeAPI {
    private readonly apiKey;
    private readonly wsBase;
    private readonly httpBase;
    constructor(client: WaveClient, opts?: {
        url?: string;
    });
    /** Subscribe to a channel; returns a RealtimeChannel (EventEmitter). */
    connect(channel: string, opts?: RealtimeConnectOptions): RealtimeChannel;
    /** Publish one event to a channel via REST (for producers that don't hold a socket). */
    publish(channel: string, event: string, data?: unknown): Promise<{
        ok: boolean;
        delivered: number;
    }>;
    /** Current presence for a channel (REST). */
    presence(channel: string): Promise<{
        channel: string;
        members: PresenceMember[];
    }>;
    /** Recent event history for a channel (REST, last-N ≤ 50). */
    history(channel: string, limit?: number): Promise<{
        channel: string;
        events: RealtimeFrame[];
    }>;
}
declare function createRealtimeAPI(client: WaveClient, opts?: {
    url?: string;
}): RealtimeAPI;

export { PresenceMember, RealtimeAPI, RealtimeChannel, RealtimeConnectOptions, RealtimeFrame, createRealtimeAPI };
