import { describe, expect, it, vi } from "vitest";

import { CustodyClient } from "../custody";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("CustodyClient", () => {
  const opts = { baseUrl: "https://api.wave.online", token: "svc" };

  it("exercise POSTs to /v1/custody/exercise and returns the sanitized receipt", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ grantId: "g1", action: "comment", resourceInstance: "wave-av/x", status: 200, body: { ok: true } }),
    );
    const c = new CustodyClient({ ...opts, fetchImpl: fetchMock });
    const r = await c.exercise({ grantId: "g1", action: "comment", resourceInstance: "wave-av/x", targetUrl: "https://api.github.com/repos/wave-av/x/issues/1/comments" });

    expect(r.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.wave.online/v1/custody/exercise");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer svc");
  });

  it("revoke POSTs grantId + revocationId", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ grantId: "g1", status: "revoked" }));
    const c = new CustodyClient({ ...opts, fetchImpl: fetchMock });
    const r = await c.revoke({ grantId: "g1", revocationId: "rv1" });
    expect(r.status).toBe("revoked");
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as Record<string, unknown>;
    expect(body).toEqual({ grantId: "g1", revocationId: "rv1" });
  });

  it("throws on a non-2xx exercise", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: "GRANT_REVOKED" }, 403));
    const c = new CustodyClient({ ...opts, fetchImpl: fetchMock });
    await expect(c.exercise({ grantId: "g1", action: "comment", resourceInstance: "x", targetUrl: "https://x" })).rejects.toThrow(/upstream 403/);
  });
});
