/**
 * CommsAPI Tests — E9.2 tenant onboarding SDK surface.
 *
 * Verifies the SDK forwards POST /v1/comms/tenants and surfaces the
 * mint-once record (pod + scoped key) to the caller.
 */

import { describe, it, expect, vi } from "vitest";
import { CommsAPI, createCommsAPI } from "../comms";
import type { WaveClient } from "../client";

function mockClient() {
  const post = vi.fn();
  const client = { post } as unknown as WaveClient;
  return { client, post };
}

describe("CommsAPI", () => {
  it("is constructable directly and via factory", () => {
    const { client } = mockClient();
    expect(new CommsAPI(client)).toBeInstanceOf(CommsAPI);
    expect(createCommsAPI(client)).toBeInstanceOf(CommsAPI);
  });

  it("createTenant() POSTs to /v1/comms/tenants with the client_id", async () => {
    const { client, post } = mockClient();
    post.mockResolvedValueOnce({ org: "acme", client_id: "acme", pod_id: "pod-1", api_key: "sk-once", api_key_id: "k1" });
    const api = new CommsAPI(client);
    const t = await api.createTenant({ client_id: "acme" });
    expect(post).toHaveBeenCalledWith("/v1/comms/tenants", { client_id: "acme" });
    expect(t.pod_id).toBe("pod-1");
    expect(t.api_key).toBe("sk-once");
  });

  it("surfaces the WaveError when the scope wall denies", async () => {
    const { client, post } = mockClient();
    post.mockRejectedValueOnce(Object.assign(new Error("forbidden"), { status: 401 }));
    const api = new CommsAPI(client);
    await expect(api.createTenant({ client_id: "acme" })).rejects.toThrow("forbidden");
  });
});

describe("CommsAPI.listTenants (E9.4)", () => {
  it("GETs /v1/comms/tenants and returns the org's rows", async () => {
    const { client, post } = mockClient();
    const get = vi.fn(async () => ({ org: "acme", tenants: [{ client_id: "acme", pod_id: "pod-1", key_id: "k1", created_at: "2026-08-24T00:00:00Z" }] }));
    Object.assign(client, { get });
    const api = new CommsAPI(client);
    const r = await api.listTenants();
    expect(get).toHaveBeenCalledWith("/v1/comms/tenants");
    expect(r.tenants[0].pod_id).toBe("pod-1");
    expect(JSON.stringify(r)).not.toContain("api_key");
    expect(post).not.toHaveBeenCalled();
  });
});
