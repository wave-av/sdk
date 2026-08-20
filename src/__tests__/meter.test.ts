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

const sampleLedger: MeterLedger = {
  rows: [
    {
      org: "org_123",
      from: "2026-08-01T00:00:00Z",
      to: "2026-08-31T23:59:59Z",
      channels: {
        mail: { ops: 150, usdc: "0.03", errors: 2 },
        voice: { minutes: 45, usdc: "0.90" },
        sms: { ops: 30, blocked: 1 },
        realtime: { minutes: 120 },
        storage: { bytes: 1073741824 },
      },
    },
  ],
  generated_at: "2026-08-19T12:00:00Z",
};

const sampleRollup: MeterRollup = {
  org: "org_123",
  from: "2026-08-01T00:00:00Z",
  to: "2026-08-31T23:59:59Z",
  totals: {
    mail: { ops: 150, usdc: "0.03", errors: 2 },
    voice: { minutes: 45, usdc: "0.90" },
    sms: { ops: 30, blocked: 1 },
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
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].channels.mail.ops).toBe(150);
  });

  it("ledger() works without params", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValue(sampleLedger);
    const api = new MeterAPI(client);

    const res = await api.ledger();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/meter/ledger", { params: undefined });
    expect(res.rows).toHaveLength(1);
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
    expect(res.totals.sms.blocked).toBe(1);
  });
});
