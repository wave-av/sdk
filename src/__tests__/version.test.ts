import { readFileSync } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SDK_VERSION } from "../version";
import { WaveClient } from "../client";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };

afterEach(() => vi.unstubAllGlobals());

describe("SDK version", () => {
  it("SDK_VERSION equals package.json version (bump both together)", () => {
    expect(SDK_VERSION).toBe(pkg.version);
  });

  it("the User-Agent carries the real package version, not a hardcoded 1.0.0", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await new WaveClient({ apiKey: "k", maxRetries: 0 }).get("/v1/network/surface");
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe(`wave-sdk-typescript/${pkg.version}`);
  });
});
