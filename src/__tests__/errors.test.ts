/**
 * The gateway emits three error envelopes. Each body below is copied from a live
 * api.wave.online response (see the PR that introduced this file for request ids).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { WaveClient } from "../client";
import {
  WaveError,
  PaymentRequiredError,
  RouteNotServedError,
  parseErrorBody,
  createWaveError,
} from "../errors";

const spendCap = {
  error: "spend_cap_exceeded",
  code: "SPEND_CAP_TIER_BLOCKED",
  message: "Add a payment method to continue",
};

const x402 = {
  x402Version: 1,
  error: "payment required",
  accepts: [
    {
      scheme: "exact",
      protocol: "x402",
      network: "base",
      maxAmountRequired: "3000",
      resource: "/v1/realtime/channels/probe_x/history",
    },
  ],
};

const scope = {
  error: {
    code: "SCOPE_INSUFFICIENT",
    message: "requires scope: realtime:write",
    required_scope: "realtime:write",
    available_scopes: ["realtime:read", "meter:read"],
    internal_trace: "must-not-leak",
  },
};

const notFound = {
  error: {
    code: "ROUTE_NOT_FOUND",
    message: "No WAVE capability is served at this path.",
    suggestions: ["Check the path for typos."],
    doc_url: "https://gateway.wave.online/.well-known/wave-skills.json",
    request_id: "rid-404",
  },
};

const notMapped = {
  error: {
    code: "ROUTE_NOT_MAPPED",
    message: "no scope rule for this route (fail-closed)",
    next_action: { type: "none", reason: "not part of the WAVE API" },
  },
};

function respond(body: unknown, status: number, requestId?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(requestId ? { "x-request-id": requestId } : {}) },
  });
}

async function failWith(body: unknown, status: number, requestId?: string): Promise<WaveError> {
  vi.stubGlobal("fetch", vi.fn(async () => respond(body, status, requestId)));
  const client = new WaveClient({ apiKey: "k", maxRetries: 0 });
  const err = await client.get("/v1/anything").catch((e: unknown) => e);
  expect(err).toBeInstanceOf(WaveError);
  return err as WaveError;
}

afterEach(() => vi.unstubAllGlobals());

describe("parseErrorBody", () => {
  it("reads the flat spend-cap envelope (code and message are siblings of a string error)", () => {
    expect(parseErrorBody(spendCap)).toEqual({
      code: "SPEND_CAP_TIER_BLOCKED",
      message: "Add a payment method to continue",
      requestId: undefined,
      details: { error: "spend_cap_exceeded" },
    });
  });

  it("reads the x402 challenge and keeps accepts[]", () => {
    const p = parseErrorBody(x402);
    expect(p.code).toBe("PAYMENT_REQUIRED");
    expect(p.message).toMatch(/x402/);
    expect(p.details?.accepts).toEqual(x402.accepts);
    expect(p.details?.x402Version).toBe(1);
  });

  it("reads the nested envelope and keeps only allowlisted sibling fields", () => {
    const p = parseErrorBody(scope);
    expect(p.code).toBe("SCOPE_INSUFFICIENT");
    expect(p.details).toEqual({ required_scope: "realtime:write", available_scopes: ["realtime:read", "meter:read"] });
    expect(p.details).not.toHaveProperty("internal_trace");
  });

  it("passes the envelope's own error.details through whole, as before, alongside allowlisted siblings", () => {
    const p = parseErrorBody({
      error: {
        code: "VALIDATION_ERROR",
        message: "bad",
        details: { field: "title", error: "too_long" },
        doc_url: "https://d",
        internal: 1,
      },
    });
    // error.details.error is data the server chose to send; it survives.
    expect(p.details).toEqual({ field: "title", error: "too_long", doc_url: "https://d" });
  });

  it("reads a request_id nested inside error", () => {
    expect(parseErrorBody(notFound).requestId).toBe("rid-404");
  });

  it("treats a flat string error with no code as the code when it looks like one (426 upgrade)", () => {
    const p = parseErrorBody({ error: "UPGRADE_REQUIRED", message: "GET /v1/connect requires a WebSocket upgrade" });
    expect(p.code).toBe("UPGRADE_REQUIRED");
    expect(p.message).toBe("GET /v1/connect requires a WebSocket upgrade");
  });

  it("returns nothing for non-object bodies", () => {
    expect(parseErrorBody(null)).toEqual({});
    expect(parseErrorBody("oops")).toEqual({});
    expect(parseErrorBody([1, 2])).toEqual({});
  });
});

describe("createWaveError", () => {
  it("maps 402 to PaymentRequiredError", () => {
    const e = createWaveError("m", "SPEND_CAP_TIER_BLOCKED", 402);
    expect(e).toBeInstanceOf(PaymentRequiredError);
    expect(e).toBeInstanceOf(WaveError);
    expect(e.retryable).toBe(false);
  });

  it("maps 404 ROUTE_NOT_FOUND / ROUTE_NOT_MAPPED to RouteNotServedError, and other 404s to WaveError", () => {
    expect(createWaveError("m", "ROUTE_NOT_FOUND", 404)).toBeInstanceOf(RouteNotServedError);
    expect(createWaveError("m", "ROUTE_NOT_MAPPED", 404)).toBeInstanceOf(RouteNotServedError);
    const other = createWaveError("m", "CLIP_NOT_FOUND", 404);
    expect(other).not.toBeInstanceOf(RouteNotServedError);
    expect(other).toBeInstanceOf(WaveError);
  });
});

describe("WaveClient surfaces every envelope as a typed error", () => {
  it("402 spend cap: code, message and class survive (previously HTTP_402 'Payment Required')", async () => {
    const e = await failWith(spendCap, 402, "rid-402");
    expect(e).toBeInstanceOf(PaymentRequiredError);
    expect(e.code).toBe("SPEND_CAP_TIER_BLOCKED");
    expect(e.message).toBe("Add a payment method to continue");
    expect(e.requestId).toBe("rid-402");
  });

  it("402 x402: the payment challenge is on the error", async () => {
    const e = (await failWith(x402, 402)) as PaymentRequiredError;
    expect(e).toBeInstanceOf(PaymentRequiredError);
    expect(e.code).toBe("PAYMENT_REQUIRED");
    expect(e.x402Version).toBe(1);
    expect(e.accepts).toEqual(x402.accepts);
  });

  it("403 scope: required_scope and available_scopes land in details", async () => {
    const e = await failWith(scope, 403);
    expect(e.code).toBe("SCOPE_INSUFFICIENT");
    expect(e.details?.required_scope).toBe("realtime:write");
    expect(e.details?.available_scopes).toEqual(["realtime:read", "meter:read"]);
  });

  it("404 ROUTE_NOT_FOUND and ROUTE_NOT_MAPPED become RouteNotServedError with the doc_url", async () => {
    const a = await failWith(notFound, 404);
    expect(a).toBeInstanceOf(RouteNotServedError);
    expect(a.details?.doc_url).toBe("https://gateway.wave.online/.well-known/wave-skills.json");
    const b = await failWith(notMapped, 404);
    expect(b).toBeInstanceOf(RouteNotServedError);
    expect(b.code).toBe("ROUTE_NOT_MAPPED");
  });

  it("a non-JSON body still yields a WaveError from the status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>bad gateway</html>", { status: 400, statusText: "Bad Request" })));
    const client = new WaveClient({ apiKey: "k", maxRetries: 0 });
    const e = (await client.get("/v1/x").catch((x: unknown) => x)) as WaveError;
    expect(e.code).toBe("HTTP_400");
    expect(e.message).toBe("Bad Request");
  });
});
