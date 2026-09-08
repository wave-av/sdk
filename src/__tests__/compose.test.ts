/**
 * Composer (`@wave-av/sdk/compose`) tests.
 *
 * 1. Schema round-trip: a fixture ComposeProposal response validates against the generated
 *    `schema/compose.schema.json` (generated from `src/compose-types.ts`, which is itself
 *    copied verbatim from the gateway's `POST /v1/compose` contract) using ajv.
 * 2. Transport mock: `compose()` issues exactly one request, `POST {baseUrl}/v1/compose`, and
 *    never calls any product route.
 * 3. Transport mock: `saveFlow()` issues exactly one request, `POST {consoleBaseUrl}/api/console/flows`,
 *    and never calls a product route or `/v1/compose` again.
 * 4. `saveFlow()` throws `ConsoleAuthRequiredError` (never a silent no-op) when no console
 *    token is supplied, and the error carries the equivalent curl.
 *
 * The fixture response below is a documented example response for `POST /v1/compose`, which is
 * itself sourced from the webinar fixture in the gateway's `test/compose-fixtures.ts` at commit
 * `882ae75` (the `WEBINAR` intent and the `validReply()` why-lines). Two fields the source
 * documentation flags as not-yet-real placeholders (`priceRows[0].quotedAt: null`,
 * `engine.promptHash: null`) are replaced here with representative non-null values, because the
 * shipped engine contract types (`QuotedPriceRow.quotedAt: number`,
 * `ComposeEngineInfo.promptHash: string`) require them. Everything else is unchanged from the
 * documented example.
 */

import { describe, it, expect, vi } from "vitest";
import Ajv from "ajv";
import composeSchema from "../../schema/compose.schema.json" with { type: "json" };
import { compose, saveFlow, ConsoleAuthRequiredError, ComposeError, isQuotedPriceRow } from "../compose";
import type { ComposeProposal } from "../compose-types";

/** `agentsPanel.example` (front-door.copy.json), with the two documented OWED nulls filled in. */
export const FIXTURE_PROPOSAL: ComposeProposal = {
  id: "prp_fixture_webinar",
  intent: "live captions for tomorrow's webinar",
  stages: [
    { product: "realtime", why: "carries your webinar audio in, sends the captioned stream back out" },
    { product: "transcribe", why: "turns speech into timed text while your webinar is still live" },
    { product: "captions", why: "puts that text on the stream your viewers are already watching" },
  ],
  productIds: ["realtime", "transcribe", "captions"],
  tools: ["perception_subscribe", "wave_create_transcription", "wave_create_caption_job"],
  scopes: [
    { scope: "realtime:read", mintable: true, source: "src/open-by-default.ts:101 (882ae75)" },
    { scope: "transcribe:read", mintable: true, source: "src/open-by-default.ts:98 (882ae75)" },
    { scope: "transcribe:write", mintable: true, source: "src/open-by-default.ts:98 (882ae75)" },
    { scope: "captions:read", mintable: true, source: "src/open-by-default.ts:99 (882ae75)" },
    { scope: "captions:write", mintable: true, source: "src/open-by-default.ts:99 (882ae75)" },
  ],
  priceRows: [
    // quotedAt: 1757100000 replaces the design pack's owed `null` (QuotedPriceRow.quotedAt: number).
    { product: "captions", meter: "wave_caption_minutes", usd: 0.025, unit: "caption minute", quotedAt: 1757100000, validForS: 60 },
    { product: "transcribe", meter: "wave_transcription_minutes", quote: "quote at call time", reason: "no 402 quote_token recorded in the pack" },
    { product: "realtime", meter: "wave_realtime_video_minutes", quote: "quote at call time", reason: "gateway default, no quote_token" },
  ],
  callShape: {
    http: "curl -X POST https://gateway.wave.online/v1/captions",
    mcp: { tool: "wave_create_caption_job", args: { body: { videoId: "<videoId>" } } },
  },
  next: ["Add chapters after the webinar ends", "Route the next call through Dispatch", "Take it to Gateway with one key"],
  executes: false,
  grounding: "snapshot",
  groundedAt: "2026-09-06T03:52:45Z",
  manifestHash: "sha256:3cb3ece3baf9da22b26216d3b543d3a805111be64303f43b4ca10552ef649709",
  engine: {
    route: "dispatch",
    // promptHash: a representative sha256 replaces the design pack's owed `null` (ComposeEngineInfo.promptHash: string).
    promptHash: "sha256:6f8db599de986fab7a21625b7916589c3f8c9caf12b3325b3f7dda4d09ae23e",
    model: null,
  },
  flowId: null,
};

describe("schema round-trip", () => {
  it("validates the fixture ComposeProposal against schema/compose.schema.json", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(composeSchema);
    const ok = validate(FIXTURE_PROPOSAL);
    expect(validate.errors).toBeNull();
    expect(ok).toBe(true);
  });

  it("rejects a proposal with a hand-added field the schema does not declare", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(composeSchema);
    const ok = validate({ ...FIXTURE_PROPOSAL, madeUpField: "nope" });
    expect(ok).toBe(false);
  });

  it("rejects a proposal missing a required field", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(composeSchema);
    const withoutFlowId: Partial<ComposeProposal> = { ...FIXTURE_PROPOSAL };
    delete withoutFlowId.flowId;
    const ok = validate(withoutFlowId);
    expect(ok).toBe(false);
  });
});

function jsonResponse(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
}

describe("isQuotedPriceRow()", () => {
  it("is true for a quoted row and false for an unquoted row (byte-for-byte the same discriminator wave-av/cli PR #61 defines locally)", () => {
    expect(isQuotedPriceRow(FIXTURE_PROPOSAL.priceRows[0])).toBe(true);
    expect(isQuotedPriceRow(FIXTURE_PROPOSAL.priceRows[1])).toBe(false);
  });
});

describe("compose()", () => {
  it("calls POST /v1/compose only, and returns the typed proposal", async () => {
    const fetchMock = jsonResponse(FIXTURE_PROPOSAL);
    const result = await compose("live captions for tomorrow's webinar", {
      apiKey: "wv_test_key",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.wave.online/v1/compose");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer wv_test_key" });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ intent: "live captions for tomorrow's webinar" });
    expect(result).toEqual(FIXTURE_PROPOSAL);
    expect(result.executes).toBe(false);
  });

  it("sends budgetUsd and flowId when provided, and never calls a product route", async () => {
    const fetchMock = jsonResponse(FIXTURE_PROPOSAL);
    await compose("caption my webinar", { budgetUsd: 5, flowId: "flw_abc123", fetchImpl: fetchMock });

    const calledUrls = (fetchMock as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(calledUrls).toEqual(["https://api.wave.online/v1/compose"]);
    for (const productPath of ["/v1/captions", "/v1/realtime", "/v1/transcribe", "/v1/render"]) {
      expect(calledUrls.some((u) => String(u).includes(productPath))).toBe(false);
    }
    const body = JSON.parse((fetchMock as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body).toEqual({ intent: "caption my webinar", budgetUsd: 5, flowId: "flw_abc123" });
  });

  it("respects a custom baseUrl", async () => {
    const fetchMock = jsonResponse(FIXTURE_PROPOSAL);
    await compose("test", { baseUrl: "https://gateway.staging.wave.online", fetchImpl: fetchMock });
    expect((fetchMock as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("https://gateway.staging.wave.online/v1/compose");
  });

  it("throws ComposeError with the gateway's code on a non-2xx response", async () => {
    const fetchMock = jsonResponse({ error: { code: "SCOPE_INSUFFICIENT", message: "composer:write required" } }, 403);
    const err: unknown = await compose("x", { fetchImpl: fetchMock }).catch((e) => e);
    expect(err).toBeInstanceOf(ComposeError);
    expect((err as ComposeError).status).toBe(403);
    expect((err as ComposeError).code).toBe("SCOPE_INSUFFICIENT");
  });
});

describe("saveFlow()", () => {
  it("throws ConsoleAuthRequiredError (never a silent no-op) with no console token", async () => {
    const fetchMock = jsonResponse({ flowId: "flw_new" });
    await expect(saveFlow(FIXTURE_PROPOSAL, { fetchImpl: fetchMock })).rejects.toThrow(ConsoleAuthRequiredError);
    expect(fetchMock).not.toHaveBeenCalled();
    const err: unknown = await saveFlow(FIXTURE_PROPOSAL, { fetchImpl: fetchMock }).catch((e) => e);
    expect((err as ConsoleAuthRequiredError).curl).toContain("POST https://console.wave.online/api/console/flows");
    expect((err as ConsoleAuthRequiredError).curl).toContain("wave-composer");
  });

  it("calls POST {consoleBaseUrl}/api/console/flows only, with createdBy.kind wave-composer, and never a product route", async () => {
    const fetchMock = jsonResponse({ flowId: "flw_new" });
    const result = await saveFlow(FIXTURE_PROPOSAL, { consoleToken: "console_tok", fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://console.wave.online/api/console/flows");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer console_tok" });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.createdBy).toEqual({ kind: "wave-composer" });
    expect(body.manifestHash).toBe(FIXTURE_PROPOSAL.manifestHash);
    expect(body.groundedAt).toBe(FIXTURE_PROPOSAL.groundedAt);
    expect(result).toEqual({ flowId: "flw_new" });

    for (const productPath of ["/v1/compose", "/v1/captions", "/v1/realtime"]) {
      expect(String(url).includes(productPath)).toBe(false);
    }
  });

  it("respects a custom consoleBaseUrl", async () => {
    const fetchMock = jsonResponse({ flowId: "flw_new" });
    await saveFlow(FIXTURE_PROPOSAL, { consoleToken: "t", consoleBaseUrl: "https://console.staging.wave.online", fetchImpl: fetchMock });
    expect((fetchMock as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("https://console.staging.wave.online/api/console/flows");
  });

  it("throws ComposeError on a non-2xx response", async () => {
    const fetchMock = jsonResponse({ error: { code: "UNKNOWN_FLOW" } }, 400);
    const err: unknown = await saveFlow(FIXTURE_PROPOSAL, { consoleToken: "t", fetchImpl: fetchMock }).catch((e) => e);
    expect(err).toBeInstanceOf(ComposeError);
    expect((err as ComposeError).code).toBe("UNKNOWN_FLOW");
  });
});
