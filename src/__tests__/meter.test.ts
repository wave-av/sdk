/**
 * MeterAPI Tests — E5 comms productization SDK surface.
 *
 * Verifies the SDK forwards the meter ledger and rollup routes:
 *   GET /v1/meter/ledger
 *   GET /v1/meter/ledger/rollup
 */

import { describe, it, expect, vi } from "vitest";
import { MeterAPI, createMeterAPI } from "../meter";
import type { WaveClient } from "../client";
import type { MeterLedger, MeterRollup } from "../meter-types";

function mockClient() {
  const get = vi.fn();
  const client = { get } as unknown as WaveClient;
  return { client, get };
}

// Shaped like the live GET /v1/meter/ledger answer (one window, top-level channels; the gateway's
// v0 MeterLedger in wave-gateway src/meter-ledger.ts). Values are illustrative.
const sampleLedger: MeterLedger = {
  org: "org_123",
  from: "2026-08-01T00:00:00.000Z",
  to: "2026-08-01T23:59:59.999Z",
  channels: {
    mail: { ops: 150, usdc: "0.03", errors: 2 },
    voice: { minutes: 45, usdc: "0.90" },
    sms: { ops: 0, blocked: "a2p-unregistered" },
    realtime: { minutes: 120 },
    storage: { bytes: 1073741824 },
  },
  generated_at: "2026-08-19T12:00:00Z",
};

const sampleRollup: MeterRollup = {
  org: "org_123",
  from: "2026-08-01T00:00:00Z",
  to: "2026-08-31T23:59:59Z",
  period: "month",
  totals: {
    mail: { ops: 150, usdc: "0.03", errors: 2 },
    voice: { minutes: 45, usdc: "0.90" },
    sms: { ops: 0, blocked: "a2p-unregistered" },
    realtime: { minutes: 120 },
    storage: { bytes: 1073741824 },
  },
  generated_at: "2026-08-19T12:00:00Z",
};

describe("MeterAPI", () => {
  it("is constructable directly and via factory", () => {
    const { client } = mockClient();
    expect(new MeterAPI(client)).toBeInstanceOf(MeterAPI);
    expect(createMeterAPI(client)).toBeInstanceOf(MeterAPI);
  });

  it("ledger() GETs /v1/meter/ledger with params", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValue(sampleLedger);
    const api = new MeterAPI(client);

    const res = await api.ledger({ channel: "mail", from: "2026-08-01" });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/meter/ledger", {
      params: { channel: "mail", from: "2026-08-01" },
    });
    expect(res.org).toBe("org_123");
    expect(res.channels.mail?.ops).toBe(150);
  });

  it("ledger() types a channel-narrowed answer (only the named channel present)", async () => {
    const { client, get } = mockClient();
    const narrowed: MeterLedger = { ...sampleLedger, channels: { voice: { minutes: 0, usdc: "0" } } };
    get.mockResolvedValue(narrowed);

    const res = await new MeterAPI(client).ledger({ channel: "voice" });

    expect(res.channels.voice?.minutes).toBe(0);
    expect(res.channels.mail).toBeUndefined();
  });

  it("ledger() works without params", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValue(sampleLedger);
    const api = new MeterAPI(client);

    const res = await api.ledger();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/meter/ledger", { params: undefined });
    expect(res.generated_at).toBe("2026-08-19T12:00:00Z");
  });

  it("rollup() GETs /v1/meter/ledger/rollup with params", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValue(sampleRollup);
    const api = new MeterAPI(client);

    const res = await api.rollup({ period: "month" });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/meter/ledger/rollup", {
      params: { period: "month" },
    });
    expect(res.totals.mail.usdc).toBe("0.03");
    expect(res.totals.voice.minutes).toBe(45);
  });

  it("rollup() works without params", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValue(sampleRollup);
    const api = new MeterAPI(client);

    const res = await api.rollup();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/meter/ledger/rollup", { params: undefined });
    expect(res.period).toBe("month");
    expect(res.totals.sms.blocked).toBe("a2p-unregistered");
  });
});
