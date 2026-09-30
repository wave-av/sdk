import { describe, it, expect, vi, afterEach } from "vitest";
import { RealtimeAPI, REALTIME_CHANNEL_PATTERN, REALTIME_PATH } from "../realtime";
import type { RealtimeSocketFactory } from "../realtime";
import { WaveClient } from "../client";
import { WaveError } from "../errors";

/** A minimal WebSocket double: records listeners so a test can drive open/message/close. */
class FakeSocket {
  listeners: Record<string, Array<(ev: unknown) => void>> = {};
  sent: string[] = [];
  closed = false;
  addEventListener(type: string, fn: (ev: unknown) => void): void {
    (this.listeners[type] ??= []).push(fn);
  }
  fire(type: string, ev: unknown = {}): void {
    for (const fn of this.listeners[type] ?? []) fn(ev);
  }
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.closed = true;
  }
}

function recordingFactory() {
  const calls: Array<{ url: string; headers: Record<string, string>; socket: FakeSocket }> = [];
  const factory: RealtimeSocketFactory = (url, headers) => {
    const socket = new FakeSocket();
    calls.push({ url, headers, socket });
    return socket as unknown as WebSocket;
  };
  return { calls, factory };
}

function client(baseUrl?: string, organizationId?: string): WaveClient {
  return new WaveClient({ apiKey: "wave-test-key", baseUrl, organizationId, maxRetries: 0 });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("RealtimeAPI endpoint derivation", () => {
  it("defaults to the gateway, not the retired realtime.wave.online host", () => {
    const rt = new RealtimeAPI(client());
    expect(rt.socketBaseUrl).toBe("wss://api.wave.online/v1/realtime");
    expect(REALTIME_PATH).toBe("/v1/realtime");
  });

  it("follows the client's baseUrl (http maps to ws)", () => {
    expect(new RealtimeAPI(client("http://localhost:8787/")).socketBaseUrl).toBe("ws://localhost:8787/v1/realtime");
    expect(new RealtimeAPI(client("https://staging.example.com")).socketBaseUrl).toBe(
      "wss://staging.example.com/v1/realtime",
    );
  });

  it("an explicit url option overrides the socket base", () => {
    const rt = new RealtimeAPI(client(), { url: "wss://edge.example.com/v1/realtime/" });
    expect(rt.socketBaseUrl).toBe("wss://edge.example.com/v1/realtime");
  });
});

describe("RealtimeAPI.connect", () => {
  it("authenticates the handshake with an Authorization header and keeps the key out of the URL", () => {
    const { calls, factory } = recordingFactory();
    const rt = new RealtimeAPI(client(undefined, "org_9"), { webSocketFactory: factory });
    const ch = rt.connect("stream:abc", { as: "agent-1", reconnect: false });
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe("wss://api.wave.online/v1/realtime/connect");
    expect(url.searchParams.get("channel")).toBe("stream:abc");
    expect(url.searchParams.get("as")).toBe("agent-1");
    expect(url.searchParams.has("access_token")).toBe(false);
    expect(calls[0].url).not.toContain("wave-test-key");
    expect(calls[0].headers).toEqual({ Authorization: "Bearer wave-test-key", "X-Organization-Id": "org_9" });
    ch.close();
  });

  it("dispatches frames as lifecycle and per-event emits", () => {
    const { calls, factory } = recordingFactory();
    const ch = new RealtimeAPI(client(), { webSocketFactory: factory }).connect("room:x", { reconnect: false });
    const cue = vi.fn();
    const presence = vi.fn();
    ch.on("caption.cue", cue);
    ch.on("presence", presence);
    const sock = calls[0].socket;
    sock.fire("message", { data: JSON.stringify({ type: "welcome", channel: "room:x", members: [{ id: "m-1" }] }) });
    sock.fire("message", { data: JSON.stringify({ type: "message", event: "caption.cue", data: { text: "hi" } }) });
    sock.fire("message", { data: "not json" });
    expect(presence).toHaveBeenCalledWith([{ id: "m-1" }]);
    expect(cue).toHaveBeenCalledWith({ text: "hi" }, expect.objectContaining({ event: "caption.cue" }));
    ch.close();
    expect(sock.closed).toBe(true);
  });

  it("a reconnect whose socket cannot be opened emits 'error' instead of throwing from a timer", () => {
    vi.useFakeTimers();
    let n = 0;
    const sockets: FakeSocket[] = [];
    const factory: RealtimeSocketFactory = () => {
      if (n++ > 0) throw new Error("no socket");
      const s = new FakeSocket();
      sockets.push(s);
      return s as unknown as WebSocket;
    };
    const ch = new RealtimeAPI(client(), { webSocketFactory: factory }).connect("room:x");
    const onError = vi.fn();
    ch.on("error", onError);
    sockets[0].fire("close", { code: 1006, reason: "" });
    vi.advanceTimersByTime(600);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "no socket" }));
    ch.close();
  });

  it("keeps retrying with growing backoff after a failed reconnect, and recovers when the factory does", () => {
    vi.useFakeTimers();
    let n = 0;
    const sockets: FakeSocket[] = [];
    const factory: RealtimeSocketFactory = () => {
      n++;
      // First open works, the next two reconnects fail, the fourth attempt succeeds.
      if (n === 2 || n === 3) throw new Error(`transient ${n}`);
      const s = new FakeSocket();
      sockets.push(s);
      return s as unknown as WebSocket;
    };
    const ch = new RealtimeAPI(client(), { webSocketFactory: factory }).connect("room:x");
    const onError = vi.fn();
    ch.on("error", onError);
    sockets[0].fire("close", { code: 1006, reason: "" });
    vi.advanceTimersByTime(500); // attempt 2 (500ms) fails
    expect(n).toBe(2);
    vi.advanceTimersByTime(999);
    expect(n).toBe(2); // backoff grew to 1000ms, not yet due
    vi.advanceTimersByTime(1); // attempt 3 (1000ms) fails
    expect(n).toBe(3);
    vi.advanceTimersByTime(2000); // attempt 4 (2000ms) succeeds
    expect(n).toBe(4);
    expect(sockets).toHaveLength(2);
    expect(onError).toHaveBeenCalledTimes(2);
    ch.close();
    vi.advanceTimersByTime(60_000);
    expect(n).toBe(4); // close() stops the loop
  });

  it("close() during a failing reconnect loop stops further attempts", () => {
    vi.useFakeTimers();
    let n = 0;
    const factory: RealtimeSocketFactory = () => {
      if (n++ > 0) throw new Error("down");
      return new FakeSocket() as unknown as WebSocket;
    };
    const ch = new RealtimeAPI(client(), { webSocketFactory: factory }).connect("room:x");
    ch.on("error", () => {});
    const first = n;
    // Drive the first socket's close through the channel's own listener.
    (ch as unknown as { ws: FakeSocket }).ws.fire("close", { code: 1006, reason: "" });
    vi.advanceTimersByTime(500);
    expect(n).toBe(first + 1);
    ch.close();
    vi.advanceTimersByTime(60_000);
    expect(n).toBe(first + 1);
  });

  it("the default factory passes the headers to the runtime's WebSocket init dict", () => {
    const ctor = vi.fn();
    class StubWebSocket extends FakeSocket {
      constructor(url: string, init: unknown) {
        super();
        ctor(url, init);
      }
    }
    vi.stubGlobal("WebSocket", StubWebSocket);
    const ch = new RealtimeAPI(client()).connect("room:x", { reconnect: false });
    expect(ctor).toHaveBeenCalledWith(
      "wss://api.wave.online/v1/realtime/connect?channel=room%3Ax",
      { headers: { Authorization: "Bearer wave-test-key" } },
    );
    ch.close();
  });

  it("the default factory refuses to run in a browser rather than put the key in the URL", () => {
    vi.stubGlobal("window", { document: {} });
    vi.stubGlobal("WebSocket", FakeSocket);
    expect(() => new RealtimeAPI(client()).connect("room:x")).toThrow(/browsers cannot send the Authorization header/);
  });

  it("the default factory explains what to do when the runtime has no WebSocket", () => {
    vi.stubGlobal("WebSocket", undefined);
    expect(() => new RealtimeAPI(client()).connect("room:x")).toThrow(/webSocketFactory/);
  });
});

describe("RealtimeAPI REST (through WaveClient)", () => {
  it("history() GETs /v1/realtime/channels/{c}/history with the key in a header", async () => {
    const fetchMock = vi.fn(async () => json({ channel: "stream:abc", events: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await new RealtimeAPI(client()).history("stream:abc", 5);
    expect(r).toEqual({ channel: "stream:abc", events: [] });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    // The channel goes into the path verbatim. Live, the gateway answers 404 ROUTE_NOT_FOUND for
    // `stream%3Aabc` and 200 for `stream:abc`.
    expect(url).toBe("https://api.wave.online/v1/realtime/channels/stream:abc/history?limit=5");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer wave-test-key");
  });

  it("rejects a channel name the gateway would not route, before any network call", async () => {
    const fetchMock = vi.fn(async () => json({}));
    vi.stubGlobal("fetch", fetchMock);
    const rt = new RealtimeAPI(client());
    for (const bad of ["Stream:ABC", "a/b", "../x", "", "-lead", "a b", "x".repeat(129)]) {
      const err = await rt.history(bad).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(WaveError);
      expect((err as WaveError).code).toBe("INVALID_CHANNEL");
      expect((err as WaveError).retryable).toBe(false);
    }
    await expect(rt.publish("a/b", "e")).rejects.toMatchObject({ code: "INVALID_CHANNEL" });
    await expect(rt.presence("a b")).rejects.toMatchObject({ code: "INVALID_CHANNEL" });
    expect(() => rt.connect("Room X", { reconnect: false, webSocketFactory: recordingFactory().factory })).toThrow(
      /invalid realtime channel/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(REALTIME_CHANNEL_PATTERN.test("stream:abc_1-2")).toBe(true);
  });

  it("publish() is never retried, even on a retryable 503 with retries enabled (not idempotent)", async () => {
    const fetchMock = vi.fn(async () => json({ error: { code: "SERVICE_UNAVAILABLE", message: "busy" } }, 503));
    vi.stubGlobal("fetch", fetchMock);
    const withRetries = new WaveClient({ apiKey: "wave-test-key", maxRetries: 3 });
    const err = await new RealtimeAPI(withRetries).publish("c", "note", { n: 1 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WaveError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("presence() GETs /v1/realtime/channels/{c}/presence", async () => {
    const fetchMock = vi.fn(async () => json({ channel: "c", members: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await new RealtimeAPI(client("http://localhost:8787")).presence("c");
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("http://localhost:8787/v1/realtime/channels/c/presence");
  });

  it("publish() POSTs the event and throws a typed WaveError on 403 instead of returning the error body", async () => {
    const fetchMock = vi.fn(async () =>
      json({ error: { code: "SCOPE_INSUFFICIENT", message: "requires scope: realtime:write", required_scope: "realtime:write" } }, 403));
    vi.stubGlobal("fetch", fetchMock);
    const err = await new RealtimeAPI(client()).publish("c", "caption.cue", { t: 1 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WaveError);
    expect((err as WaveError).code).toBe("SCOPE_INSUFFICIENT");
    expect((err as WaveError).details?.required_scope).toBe("realtime:write");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.wave.online/v1/realtime/channels/c/publish");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ event: "caption.cue", data: { t: 1 } });
  });
});
