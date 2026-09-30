/**
 * Error-body parsing. The gateway's spend-cap (402) and mesh (400) paths answer with a FLAT body,
 * `{error:"<slug>", code:"<CODE>", message:"<text>"}`, not the canonical `{error:{code,message}}`.
 * The nested-only reader dropped both fields, so `wave clip list` showed "HTTP_402 Payment Required"
 * instead of "Add a payment method to continue".
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { WaveClient, WaveError } from "../client";
import { parseErrorBody } from "../client-errors";

describe("parseErrorBody", () => {
  it("reads the canonical nested envelope", () => {
    const r = parseErrorBody(
      { error: { code: "SCOPE_INSUFFICIENT", message: "requires scope: productions:read", details: { scope: "productions:read" } }, request_id: "req-1" },
      403,
      "Forbidden",
    );
    expect(r).toEqual({
      code: "SCOPE_INSUFFICIENT",
      message: "requires scope: productions:read",
      details: { scope: "productions:read" },
      requestId: "req-1",
    });
  });

  it("keeps code and message from the flat spend-cap body (live 402 shape)", () => {
    const r = parseErrorBody(
      {
        error: "spend_cap_exceeded",
        code: "SPEND_CAP_TIER_BLOCKED",
        message: "Add a payment method to continue — this action exceeds your plan's included allotment.",
        dimension: "wave_clip_minutes",
      },
      402,
      "Payment Required",
    );
    expect(r.code).toBe("SPEND_CAP_TIER_BLOCKED");
    expect(r.message).toMatch(/^Add a payment method/);
    expect(r.details).toEqual({ error: "spend_cap_exceeded", dimension: "wave_clip_minutes" });
  });

  it("uses a bare string error as the message, and as the code only when it is a slug", () => {
    // Live mesh 400 shape: a sentence, so the code stays status-derived.
    const mesh = parseErrorBody({ error: "missing x-wave-node" }, 400, "Bad Request");
    expect(mesh.code).toBe("HTTP_400");
    expect(mesh.message).toBe("missing x-wave-node");
    expect(mesh.details).toBeUndefined();

    const slug = parseErrorBody({ error: "no_such_route" }, 404, "Not Found");
    expect(slug.code).toBe("no_such_route");
    expect(slug.message).toBe("no_such_route");
  });

  it("falls back to the status for empty, non-object, or unrecognized bodies", () => {
    expect(parseErrorBody(undefined, 502, "Bad Gateway")).toEqual({ code: "HTTP_502", message: "Bad Gateway" });
    expect(parseErrorBody("oops", 500, "")).toEqual({ code: "HTTP_500", message: "Request failed with status 500" });
    expect(parseErrorBody({}, 404, "Not Found")).toMatchObject({ code: "HTTP_404", message: "Not Found" });
  });
});

describe("WaveClient surfaces the flat body on a failed request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects with the gateway's code and message, not HTTP_402", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: "spend_cap_exceeded",
            code: "SPEND_CAP_TIER_BLOCKED",
            message: "Add a payment method to continue.",
          }),
          { status: 402, statusText: "Payment Required", headers: { "content-type": "application/json", "x-request-id": "req-402" } },
        ),
      ),
    );
    const client = new WaveClient({ apiKey: "wave_test_key", maxRetries: 0 });
    const err = await client.get("/v1/clips").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WaveError);
    expect((err as WaveError).code).toBe("SPEND_CAP_TIER_BLOCKED");
    expect((err as WaveError).message).toBe("Add a payment method to continue.");
    expect((err as WaveError).statusCode).toBe(402);
    expect((err as WaveError).requestId).toBe("req-402");
  });
});
