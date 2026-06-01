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

import { EventEmitter } from 'eventemitter3';
import type { WaveClient } from './client';

export * from './realtime-types';
import type {
  PresenceMember,
  RealtimeConnectOptions,
  RealtimeFrame,
} from './realtime-types';

const DEFAULT_WS = 'wss://realtime.wave.online';

/** Derive the https REST origin from the (ws) realtime base URL. */
function httpOrigin(wsUrl: string): string {
  return wsUrl.replace(/^ws/i, 'http').replace(/\/+$/, '');
}

/**
 * One subscribed channel = one WebSocket. Emits lifecycle events ('open'|'close'|'error'|'message'|
 * 'presence'|'join'|'leave') AND a typed event per WAVE event name (e.g. `.on('caption.cue', cb)`).
 */
export class RealtimeChannel extends EventEmitter {
  private ws: WebSocket | null = null;
  private closedByUser = false;
  private attempt = 0;
  private readonly wsBase: string;
  private readonly httpBase: string;

  constructor(
    public readonly channel: string,
    private readonly apiKey: string,
    private readonly opts: RealtimeConnectOptions = {},
  ) {
    super();
    this.wsBase = (opts.url || DEFAULT_WS).replace(/\/+$/, '');
    this.httpBase = httpOrigin(this.wsBase);
    this.open();
  }

  private url(): string {
    const u = new URL(`${this.wsBase}/v1/connect`);
    u.searchParams.set('channel', this.channel);
    if (this.opts.as) u.searchParams.set('as', this.opts.as);
    // Browser WebSocket cannot set Authorization headers → token travels as a query param (over wss).
    u.searchParams.set('access_token', this.apiKey);
    return u.toString();
  }

  private open(): void {
    const ws = new WebSocket(this.url());
    this.ws = ws;
    ws.addEventListener('open', () => {
      this.attempt = 0;
      this.emit('open');
    });
    ws.addEventListener('message', (ev: MessageEvent) => {
      let frame: RealtimeFrame;
      try {
        frame = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as RealtimeFrame;
      } catch {
        return;
      }
      this.emit('message', frame);
      if (frame.type === 'join' && frame.member) this.emit('join', frame.member);
      else if (frame.type === 'leave' && frame.member) this.emit('leave', frame.member);
      else if (frame.type === 'presence' && frame.members) this.emit('presence', frame.members);
      else if (frame.type === 'welcome' && frame.members) this.emit('presence', frame.members);
      else if (frame.type === 'message' && frame.event) this.emit(frame.event, frame.data, frame);
    });
    ws.addEventListener('error', () => this.emit('error', new Error('realtime socket error')));
    ws.addEventListener('close', (ev: CloseEvent) => {
      this.emit('close', { code: ev.code, reason: ev.reason });
      if (!this.closedByUser && (this.opts.reconnect ?? true)) this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    const max = this.opts.maxBackoffMs ?? 15000;
    const delay = Math.min(max, 500 * 2 ** this.attempt++);
    setTimeout(() => {
      if (!this.closedByUser) this.open();
    }, delay);
  }

  /** Publish an event to this channel over the socket (fire-and-forget). */
  send(event: string, data?: unknown): void {
    this.ws?.send(JSON.stringify({ op: 'publish', event, data }));
  }

  /** Request the current presence list (arrives as a 'presence' event). */
  requestPresence(): void {
    this.ws?.send(JSON.stringify({ op: 'presence' }));
  }

  /** Close the socket and stop reconnecting. */
  close(): void {
    this.closedByUser = true;
    this.ws?.close();
    this.removeAllListeners();
  }
}

/**
 * Realtime entry point. `wave.realtime.connect('stream:abc').on('transcription.partial', …)`.
 * Presence/history/publish are also available as one-shot REST calls (no socket needed) for producers.
 */
export class RealtimeAPI {
  private readonly apiKey: string;
  private readonly wsBase: string;
  private readonly httpBase: string;

  constructor(client: WaveClient, opts: { url?: string } = {}) {
    const info = client.getConnectionInfo();
    this.apiKey = info.apiKey;
    this.wsBase = (opts.url || DEFAULT_WS).replace(/\/+$/, '');
    this.httpBase = httpOrigin(this.wsBase);
  }

  /** Subscribe to a channel; returns a RealtimeChannel (EventEmitter). */
  connect(channel: string, opts: RealtimeConnectOptions = {}): RealtimeChannel {
    return new RealtimeChannel(channel, this.apiKey, { url: this.wsBase, ...opts });
  }

  /** Publish one event to a channel via REST (for producers that don't hold a socket). */
  async publish(channel: string, event: string, data?: unknown): Promise<{ ok: boolean; delivered: number }> {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ event, data }),
    });
    return (await r.json()) as { ok: boolean; delivered: number };
  }

  /** Current presence for a channel (REST). */
  async presence(channel: string): Promise<{ channel: string; members: PresenceMember[] }> {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/presence`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return (await r.json()) as { channel: string; members: PresenceMember[] };
  }

  /** Recent event history for a channel (REST, last-N ≤ 50). */
  async history(channel: string, limit = 50): Promise<{ channel: string; events: RealtimeFrame[] }> {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/history?limit=${limit}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return (await r.json()) as { channel: string; events: RealtimeFrame[] };
  }
}

export function createRealtimeAPI(client: WaveClient, opts?: { url?: string }): RealtimeAPI {
  return new RealtimeAPI(client, opts);
}
