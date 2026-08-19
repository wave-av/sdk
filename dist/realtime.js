"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/realtime.ts
var realtime_exports = {};
__export(realtime_exports, {
  RealtimeAPI: () => RealtimeAPI,
  RealtimeChannel: () => RealtimeChannel,
  createRealtimeAPI: () => createRealtimeAPI
});
module.exports = __toCommonJS(realtime_exports);
var import_eventemitter3 = require("eventemitter3");
var DEFAULT_WS = "wss://realtime.wave.online";
function httpOrigin(wsUrl) {
  return wsUrl.replace(/^ws/i, "http").replace(/\/+$/, "");
}
var RealtimeChannel = class extends import_eventemitter3.EventEmitter {
  constructor(channel, apiKey, opts = {}) {
    super();
    this.channel = channel;
    this.apiKey = apiKey;
    this.opts = opts;
    this.wsBase = (opts.url || DEFAULT_WS).replace(/\/+$/, "");
    this.httpBase = httpOrigin(this.wsBase);
    this.open();
  }
  channel;
  apiKey;
  opts;
  ws = null;
  closedByUser = false;
  attempt = 0;
  wsBase;
  httpBase;
  url() {
    const u = new URL(`${this.wsBase}/v1/connect`);
    u.searchParams.set("channel", this.channel);
    if (this.opts.as) u.searchParams.set("as", this.opts.as);
    u.searchParams.set("access_token", this.apiKey);
    return u.toString();
  }
  open() {
    const ws = new WebSocket(this.url());
    this.ws = ws;
    ws.addEventListener("open", () => {
      this.attempt = 0;
      this.emit("open");
    });
    ws.addEventListener("message", (ev) => {
      let frame;
      try {
        frame = JSON.parse(typeof ev.data === "string" ? ev.data : "");
      } catch {
        return;
      }
      this.emit("message", frame);
      if (frame.type === "join" && frame.member) this.emit("join", frame.member);
      else if (frame.type === "leave" && frame.member) this.emit("leave", frame.member);
      else if (frame.type === "presence" && frame.members) this.emit("presence", frame.members);
      else if (frame.type === "welcome" && frame.members) this.emit("presence", frame.members);
      else if (frame.type === "message" && frame.event) this.emit(frame.event, frame.data, frame);
    });
    ws.addEventListener("error", () => this.emit("error", new Error("realtime socket error")));
    ws.addEventListener("close", (ev) => {
      this.emit("close", { code: ev.code, reason: ev.reason });
      if (!this.closedByUser && (this.opts.reconnect ?? true)) this.scheduleReconnect();
    });
  }
  scheduleReconnect() {
    const max = this.opts.maxBackoffMs ?? 15e3;
    const delay = Math.min(max, 500 * 2 ** this.attempt++);
    setTimeout(() => {
      if (!this.closedByUser) this.open();
    }, delay);
  }
  /** Publish an event to this channel over the socket (fire-and-forget). */
  send(event, data) {
    this.ws?.send(JSON.stringify({ op: "publish", event, data }));
  }
  /** Request the current presence list (arrives as a 'presence' event). */
  requestPresence() {
    this.ws?.send(JSON.stringify({ op: "presence" }));
  }
  /** Close the socket and stop reconnecting. */
  close() {
    this.closedByUser = true;
    this.ws?.close();
    this.removeAllListeners();
  }
};
var RealtimeAPI = class {
  apiKey;
  wsBase;
  httpBase;
  constructor(client, opts = {}) {
    const info = client.getConnectionInfo();
    this.apiKey = info.apiKey;
    this.wsBase = (opts.url || DEFAULT_WS).replace(/\/+$/, "");
    this.httpBase = httpOrigin(this.wsBase);
  }
  /** Subscribe to a channel; returns a RealtimeChannel (EventEmitter). */
  connect(channel, opts = {}) {
    return new RealtimeChannel(channel, this.apiKey, { url: this.wsBase, ...opts });
  }
  /** Publish one event to a channel via REST (for producers that don't hold a socket). */
  async publish(channel, event, data) {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ event, data })
    });
    return await r.json();
  }
  /** Current presence for a channel (REST). */
  async presence(channel) {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/presence`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
    return await r.json();
  }
  /** Recent event history for a channel (REST, last-N ≤ 50). */
  async history(channel, limit = 50) {
    const r = await fetch(`${this.httpBase}/v1/channels/${encodeURIComponent(channel)}/history?limit=${limit}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
    return await r.json();
  }
};
function createRealtimeAPI(client, opts) {
  return new RealtimeAPI(client, opts);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RealtimeAPI,
  RealtimeChannel,
  createRealtimeAPI
});
