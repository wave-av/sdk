import { describe, expect, it, vi } from "vitest";

import { CATALOG, ProductClient, listProducts, resolveProduct } from "../products";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("product catalog client", () => {
  it("resolves a product id to its surface", () => {
    const c = resolveProduct("captions");
    expect(c?.surface).toBe("https://captions.wave.online");
    expect(resolveProduct("nope")).toBeUndefined();
  });

  it("lists the full catalog", () => {
    expect(listProducts().length).toBeGreaterThanOrEqual(30);
    expect(CATALOG[0].id).toBe("gateway");
  });

  it("calls a product surface with the shared bearer", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const c = new ProductClient({ productId: "captions", token: "wave_key", fetchImpl: fetchMock });
    const r = await c.call<{ ok: boolean }>("/v1/transcribe", { body: { source: "x" } });
    expect(r.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://captions.wave.online/v1/transcribe");
    expect((init as RequestInit).headers as Record<string, string>).toMatchObject({ authorization: "Bearer wave_key" });
  });

  it("rejects an unknown product id", () => {
    expect(() => new ProductClient({ productId: "nope" })).toThrow(/unknown product/);
  });

  it("does not enforce phase (a planned product call is the honest edge 404)", async () => {
    const fetchMock = vi.fn(async () => new Response("not found", { status: 404 }));
    const c = new ProductClient({ productId: "render", fetchImpl: fetchMock });
    await expect(c.call("/x")).rejects.toThrow(/upstream 404/);
  });
});
