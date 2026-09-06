import { describe, expect, it, vi } from "vitest";

import { AutomationsClient } from "../automations";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("AutomationsClient", () => {
  it("POSTs an event to the webhook endpoint and returns the dispatch result", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ matched: ["com.wave.escalations"], dispatched: [{ id: "com.wave.escalations", status: 0, stdout: "esc", stderr: "" }] }),
    );
    const c = new AutomationsClient({ endpoint: "https://automations.wave.online", fetchImpl: fetchMock });
    const r = await c.dispatch({ channel: "#customer-escalations", text: "needs repro" });

    expect(r.matched).toEqual(["com.wave.escalations"]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://automations.wave.online/");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect((JSON.parse(init.body as string) as Record<string, unknown>).channel).toBe("#customer-escalations");
  });

  it("throws on a non-2xx response", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: "DISPATCH_FAILED" }, 500));
    const c = new AutomationsClient({ endpoint: "https://automations.wave.online", fetchImpl: fetchMock });
    await expect(c.dispatch({ x: 1 })).rejects.toThrow(/upstream 500/);
  });
});
