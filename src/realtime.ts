import { stripTrailingSlashes } from './url-util';
/**
 * WAVE SDK - Realtime API
 *
 * The WAVE Realtime control & event plane: presence, pub/sub broadcast, and the streaming-event bus
 * the WAVE AI products push into. Subscribe once to a channel and receive live transcription /
 * captions / sentiment / clip / stream events with no polling.
 *
 * The gateway serves it under the API base URL: `GET /v1/realtime/connect` (WebSocket upgrade) and
 * `/v1/realtime/channels/{channel}/{publish,presence,history}`. The SDK derives both from the
 * client's `baseUrl`, so `new Wave({ baseUrl })` moves realtime with every other module.
 *
 * NOTE: This is a client SDK. Auth, scope (realtime:read / realtime:write), entitlement, and
 * metering are enforced server-side by the gateway. The API key travels only in the
 * `Authorization` header, on the REST calls and on the WebSocket handshake, never in a URL.
 */

import { EventEmitter } from 'eventemitter3';
import type { WaveClient } from './client';
import { WaveError } from './errors';

export * from './realtime-types';
import type {
  PresenceMember,
  RealtimeConnectOptions,
  RealtimeFrame,
  RealtimeSocketFactory,
} from './realtime-types';

/** Where the realtime plane lives under the API base URL. */
export const REALTIME_PATH = '/v1/realtime';

/**
 * The channel names the gateway routes: lowercase, starting with a letter or digit, then letters,
 * digits, `:`, `_` or `-`, at most 128 characters. `:` namespaces a channel (`stream:abc`).
 */
export const REALTIME_CHANNEL_PATTERN = /^[a-z0-9][a-z0-9:_-]{0,127}$/;

/**
 * Reject a channel name the gateway would not route, before any network call. A name that passes
 * contains no character that needs escaping, so it goes into the path verbatim: percent-encoding
 * `:` as `%3A` makes the gateway answer 404 ROUTE_NOT_FOUND.
 */
export function assertRealtimeChannel(channel: string): string {
  if (typeof channel !== 'string' || !REALTIME_CHANNEL_PATTERN.test(channel)) {
    throw new WaveError(
      `invalid realtime channel ${JSON.stringify(channel)}: use 1-128 characters of a-z, 0-9, ':', '_' ` +
        `or '-', starting with a letter or digit (e.g. "stream:abc")`,
      'INVALID_CHANNEL',
      400,
    );
  }
  return channel;
}

/** Map an http(s) origin to ws(s); ws(s) URLs pass through unchanged. */
function toWebSocketUrl(url: string): string {
  return stripTrailingSlashes(url.replace(/^http(s?):/i, 'ws$1:'));
}

function isBrowser(): boolean {
  const g = globalThis as { window?: { document?: unknown } };
  return typeof g.window !== 'undefined' && typeof g.window.document !== 'undefined';
}

/**
 * Default socket factory. Server runtimes whose global WebSocket accepts an init dict with
 * `headers` (Node >= 22 via undici, Bun) send the Authorization header on the handshake. Browsers
 * cannot set WebSocket headers at all, and the gateway does not accept a key in the URL, so a
 * browser needs a server-side relay or a custom factory.
 */
const defaultSocketFactory: RealtimeSocketFactory = (url, headers) => {
  if (isBrowser()) {
    throw new Error(
      'wave.realtime.connect: browsers cannot send the Authorization header on a WebSocket, and the ' +
        'gateway does not accept an API key in the URL. Open the socket from your server, or pass ' +
        'webSocketFactory.',
    );
  }
  const WS = (globalThis as { WebSocket?: new (url: string, init?: unknown) => WebSocket }).WebSocket;
  if (!WS) {
    throw new Error(
      'wave.realtime.connect: this runtime has no global WebSocket (Node < 22). Pass webSocketFactory, ' +
        'e.g. with the ws package: (url, headers) => new WS(url, { headers }).',
    );
  }
  return new WS(url, { headers });
};

/**
 * One subscribed channel = one WebSocket. Emits lifecycle events ('open'|'close'|'error'|'message'|
 * 'presence'|'join'|'leave') AND a typed event per WAVE event name (e.g. `.on('caption.cue', cb)`).
 */
export class RealtimeChannel extends EventEmitter {
  private ws: WebSocket | null = null;
  private closedByUser = false;
  private attempt = 0;
  private readonly wsBase: string;
  private readonly socketFactory: RealtimeSocketFactory;

  constructor(
    public readonly channel: string,
    private readonly apiKey: string,
    private readonly opts: RealtimeConnectOptions = {},
    private readonly extraHeaders: Record<string, string> = {},
  ) {
    super();
    assertRealtimeChannel(channel);
    this.wsBase = toWebSocketUrl(opts.url || `wss://api.wave.online${REALTIME_PATH}`);
    this.socketFactory = opts.webSocketFactory || defaultSocketFactory;
    this.open();
  }

  /** The handshake URL. Carries the channel and member id only; the key goes in a header. */
  url(): string {
    const u = new URL(`${this.wsBase}/connect`);
    u.searchParams.set('channel', this.channel);
    if (this.opts.as) u.searchParams.set('as', this.opts.as);
    return u.toString();
  }

  private open(): void {
    const ws = this.socketFactory(this.url(), {
      ...this.extraHeaders,
      Authorization: `Bearer ${this.apiKey}`,
    });
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
      if (this.closedByUser) return;
      try {
        this.open();
      } catch (err) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      }
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
 * Presence/history/publish are also available as one-shot REST calls (no socket needed) for
 * producers. The REST calls go through WaveClient, so a non-2xx answer throws a typed WaveError.
 */
export class RealtimeAPI {
  private readonly apiKey: string;
  private readonly wsBase: string;
  private readonly extraHeaders: Record<string, string>;
  private readonly webSocketFactory?: RealtimeSocketFactory;

  constructor(
    private readonly client: WaveClient,
    opts: { url?: string; webSocketFactory?: RealtimeSocketFactory } = {},
  ) {
    const info = client.getConnectionInfo();
    this.apiKey = info.apiKey;
    this.extraHeaders = info.organizationId ? { 'X-Organization-Id': info.organizationId } : {};
    this.wsBase = toWebSocketUrl(opts.url || `${stripTrailingSlashes(info.baseUrl)}${REALTIME_PATH}`);
    this.webSocketFactory = opts.webSocketFactory;
  }

  /** The WebSocket base this instance connects to (e.g. `wss://api.wave.online/v1/realtime`). */
  get socketBaseUrl(): string {
    return this.wsBase;
  }

  /** Subscribe to a channel; returns a RealtimeChannel (EventEmitter). Requires realtime:read. */
  connect(channel: string, opts: RealtimeConnectOptions = {}): RealtimeChannel {
    return new RealtimeChannel(
      channel,
      this.apiKey,
      { url: this.wsBase, webSocketFactory: this.webSocketFactory, ...opts },
      this.extraHeaders,
    );
  }

  /** Throws WaveError INVALID_CHANNEL (rejecting the calling method) for a name the gateway would not route. */
  private channelPath(channel: string, action: 'publish' | 'presence' | 'history'): string {
    return `${REALTIME_PATH}/channels/${assertRealtimeChannel(channel)}/${action}`;
  }

  /** Publish one event to a channel via REST (for producers that don't hold a socket). Requires realtime:write. */
  async publish(channel: string, event: string, data?: unknown): Promise<{ ok: boolean; delivered: number }> {
    return this.client.post<{ ok: boolean; delivered: number }>(this.channelPath(channel, 'publish'), {
      event,
      data,
    });
  }

  /** Current presence for a channel (REST). Requires realtime:read. */
  async presence(channel: string): Promise<{ channel: string; members: PresenceMember[] }> {
    return this.client.get<{ channel: string; members: PresenceMember[] }>(this.channelPath(channel, 'presence'));
  }

  /** Recent event history for a channel (REST, last-N ≤ 50). Requires realtime:read. */
  async history(channel: string, limit = 50): Promise<{ channel: string; events: RealtimeFrame[] }> {
    return this.client.get<{ channel: string; events: RealtimeFrame[] }>(this.channelPath(channel, 'history'), {
      params: { limit },
    });
  }
}

export function createRealtimeAPI(
  client: WaveClient,
  opts?: { url?: string; webSocketFactory?: RealtimeSocketFactory },
): RealtimeAPI {
  return new RealtimeAPI(client, opts);
}
