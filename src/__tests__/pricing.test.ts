import { describe, it, expect, vi } from "vitest";
import { WaveClient } from "../client";
import { PricingAPI, createPricingAPI } from "../pricing";

function clientWith(post: ReturnType<typeof vi.fn>, get: ReturnType<typeof vi.fn>): WaveClient {
  return { post, get } as unknown as WaveClient;
}

describe("PricingAPI", () => {
  it("creates a manifest via POST /v1/pricing/manifests", async () => {
    const post = vi.fn(async () => ({ slug: "acme-news", org: "acme", status: "published", updated_at: "t" }));
    const api = new PricingAPI(clientWith(post, vi.fn()));
    const res = await api.createManifest({ slug: "acme-news", title: "Acme", tiers: [] });
    expect(res.slug).toBe("acme-news");
    expect(post).toHaveBeenCalledWith("/v1/pricing/manifests", expect.anything());
  });

  it("lists manifests", async () => {
    const get = vi.fn(async () => ({ org: "acme", manifests: [] }));
    const api = new PricingAPI(clientWith(vi.fn(), get));
    const res = await api.listManifests();
    expect(res.org).toBe("acme");
    expect(get).toHaveBeenCalledWith("/v1/pricing/manifests");
  });

  it("reads one manifest with an encoded slug", async () => {
    const get = vi.fn(async () => ({ org: "acme", slug: "acme-news", status: "published", updated_at: "t", manifest: {} }));
    const api = new PricingAPI(clientWith(vi.fn(), get));
    await api.getManifest("acme-news");
    expect(get).toHaveBeenCalledWith("/v1/pricing/manifests/acme-news");
  });

  it("factory returns a PricingAPI", () => {
    const api = createPricingAPI(clientWith(vi.fn(), vi.fn()));
    expect(api).toBeInstanceOf(PricingAPI);
  });
});
