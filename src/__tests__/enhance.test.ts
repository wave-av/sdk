/**
 * EnhanceAPI Tests (wave-gateway#799) — AI video super-resolution SDK surface.
 *
 * POST /v1/enhance takes/returns raw video bytes (not JSON), so EnhanceAPI bypasses
 * WaveClient.post() and talks to fetch() directly (the same escape hatch RealtimeAPI uses) —
 * these tests mock global fetch rather than WaveClient.post/get.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnhanceAPI, createEnhanceAPI } from "../enhance";
import type { WaveClient } from "../client";
import { WaveError } from "../client";

function mockClient(): WaveClient {
  return {
    getConnectionInfo: () => ({
      apiKey: "wave_test_key",
      baseUrl: "https://api.wave.online",
      organizationId: "org_123",
    }),
  } as unknown as WaveClient;
}

function receiptHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    "content-type": "video/mp4",
    "x-enhance-model": "espcn",
    "x-enhance-scale-factor": "3",
    "x-enhance-input-dimensions": "1280x720",
    "x-enhance-output-dimensions": "672x672",
    "x-wave-meter": "wave_enhance_minutes",
    "x-wave-usage-minutes": "2",
    ...overrides,
  });
}

describe("EnhanceAPI", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is constructable directly and via factory", () => {
    const client = mockClient();
    expect(new EnhanceAPI(client)).toBeInstanceOf(EnhanceAPI);
    expect(createEnhanceAPI(client)).toBeInstanceOf(EnhanceAPI);
  });

  it("enhance() POSTs raw bytes to /v1/enhance?model=espcn and parses the receipt headers", async () => {
    const videoBytes = new Uint8Array([1, 2, 3]);
    const videoBlob = new Blob(["fake-video"], { type: "video/mp4" });
    fetchMock.mockResolvedValue(
      new Response(videoBlob, { status: 200, headers: receiptHeaders() })
    );

    const api = new EnhanceAPI(mockClient());
    const result = await api.enhance(videoBytes, { contentType: "video/mp4" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.wave.online/v1/enhance?model=espcn");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer wave_test_key");
    expect((init.headers as Record<string, string>)["content-type"]).toBe("video/mp4");
    expect(init.body).toBe(videoBytes);

    expect(result.receipt).toEqual({
      model: "espcn",
      scaleFactor: 3,
      inputWidth: 1280,
      inputHeight: 720,
      outputWidth: 672,
      outputHeight: 672,
      meter: "wave_enhance_minutes",
      usageMinutes: 2,
    });
    expect(result.contentType).toBe("video/mp4");
  });

  it("enhanceFromUrl() sends ?url= and no request body", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Blob(["fake"]), { status: 200, headers: receiptHeaders() })
    );

    const api = new EnhanceAPI(mockClient());
    await api.enhanceFromUrl("https://example.com/source.mp4");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.wave.online/v1/enhance?model=espcn&url=https%3A%2F%2Fexample.com%2Fsource.mp4"
    );
    expect(init.body).toBeUndefined();
  });

  it("throws a WaveError with the x402 challenge on 402", async () => {
    const challengeBody = {
      error: "payment required",
      error_detail: { code: "PAYMENT_REQUIRED", message: "pay the x402 challenge and retry" },
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(challengeBody), {
        status: 402,
        headers: { "content-type": "application/json" },
      })
    );

    const api = new EnhanceAPI(mockClient());
    await expect(api.enhance(new Uint8Array([1]))).rejects.toMatchObject({
      statusCode: 402,
      code: "PAYMENT_REQUIRED",
    });
  });

  it("throws a WaveError when the server omits a required receipt header", async () => {
    const headers = receiptHeaders();
    headers.delete("x-wave-usage-minutes");
    fetchMock.mockResolvedValue(new Response(new Blob(["fake"]), { status: 200, headers }));

    const api = new EnhanceAPI(mockClient());
    await expect(api.enhance(new Uint8Array([1]))).rejects.toBeInstanceOf(WaveError);
  });
});
