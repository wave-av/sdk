/**
 * WebhooksAPI tests — E9.3 SDK cell.
 * Verifies registerTenantWebhook POSTs /v1/comms/webhooks with the configured client.
 */

import { describe, it, expect, vi } from "vitest";
import { WebhooksAPI, createWebhooksAPI } from "../webhooks";
import type { WaveClient } from "../client";

describe("WebhooksAPI", () => {
  it("is constructable directly and via factory", () => {
    const client = { post: vi.fn() } as unknown as WaveClient;
    expect(new WebhooksAPI(client)).toBeInstanceOf(WebhooksAPI);
    expect(createWebhooksAPI(client)).toBeInstanceOf(WebhooksAPI);
  });

  it("registerTenantWebhook() POSTs to /v1/comms/webhooks", async () => {
    const post = vi.fn(async (_path: string, body?: unknown) => {
      expect(_path).toBe("/v1/comms/webhooks");
      expect(body).toEqual({ inbox: "a@b.co", url: "https://tenant.example/hook", secret: "s".repeat(40) });
      return { ok: true, inbox: "a@b.co" };
    });
    const api = new WebhooksAPI({ post } as unknown as WaveClient);
    const r = await api.registerTenantWebhook({ inbox: "a@b.co", url: "https://tenant.example/hook", secret: "s".repeat(40) });
    expect(r.ok).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
