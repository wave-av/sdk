import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cliOptionsFromEnv, DEFAULT_API_BASE_URL, DEFAULT_RUNTIME_URL, redact, runWaveCli } from "../cli";

describe("src/cli.ts stays a pure library module (no bin-entry side effects)", () => {
  // cli.ts is re-exported from src/index.ts, so it is built to BOTH cjs and esm and its compiled
  // output lands in a chunk shared by every ESM entry point (dist/index.mjs, dist/bin.mjs, ...).
  // A top-level side effect here — historically `if (require.main === module) { ... }`, a
  // CJS-only idiom that references the bare `module` identifier — throws
  // `ReferenceError: module is not defined in ES module scope` the instant that shared chunk
  // evaluates under real ESM, crashing `import("@wave-av/sdk")` for every caller, not just CLI
  // users. This shipped in 2.1.1/2.1.2. Fix: the bin-only side effect lives in src/bin.ts, which
  // nothing else imports and therefore can never be folded into a shared chunk. This is a fast,
  // source-level tripwire for that invariant: cli.ts must never re-introduce a bin-entry guard.
  // The real, load-bearing regression guards are src/__tests__/pack-esm-smoke.test.ts (packs +
  // installs + imports for real) and .github/workflows/smoke-install.yml (same, in CI, on every
  // PR/push) — a plain `node -e`/`--input-type=module -e` check does not reliably reproduce a
  // module-top-level throw and must never be the only guard (see release.yml's e2e-smoke fix).
  it("has no require.main / module top-level reference in executable code", () => {
    const cliSourcePath = fileURLToPath(new URL("../cli.ts", import.meta.url));
    const codeLines = readFileSync(cliSourcePath, "utf8")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"));
    const code = codeLines.join("\n");
    expect(code).not.toMatch(/require\.main/);
    expect(code).not.toMatch(/^\s*if\s*\(.*\bmodule\b/m);
  });
});

describe("wave CLI", () => {
  const TOKEN = "wave-test-token";
  const opts = { baseUrl: DEFAULT_RUNTIME_URL, token: TOKEN };

  function stubFetch(handler: (url: string, init: RequestInit) => Response) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
      calls.push({ url: String(input), init });
      return handler(String(input), init);
    }) as typeof fetch;
    return { calls, fetchImpl };
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  it("wave models lists model ids from the gateway's /v1/inference/models, with the key", async () => {
    const { calls, fetchImpl } = stubFetch(() => json({ object: "list", data: [{ id: "qwen2.5:3b" }, { id: "qwen3-coder:30b" }] }));
    const r = await runWaveCli(["models"], { ...opts, fetchImpl });
    expect(r).toEqual({ code: 0, out: "qwen2.5:3b\nqwen3-coder:30b\n" });
    expect(calls[0].url).toBe("https://api.wave.online/v1/inference/models");
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("wave models against the gateway without a key asks for WAVE_API_KEY instead of calling", async () => {
    const { calls, fetchImpl } = stubFetch(() => json({}));
    const r = await runWaveCli(["models"], { ...opts, token: undefined, fetchImpl });
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/set WAVE_API_KEY/);
    expect(calls).toHaveLength(0);
  });

  it("wave models against an open door (WAVE_RUNTIME_URL) still works without a key", async () => {
    const { calls, fetchImpl } = stubFetch(() => json({ data: [{ id: "qwen2.5:3b" }] }));
    const r = await runWaveCli(["models"], { baseUrl: "https://runtime.wave.online/v1", fetchImpl });
    expect(r).toEqual({ code: 0, out: "qwen2.5:3b\n" });
    expect(calls[0].url).toBe("https://runtime.wave.online/v1/models");
  });

  it("an upstream failure becomes one line on err + exit 1, never a thrown stack", async () => {
    const { fetchImpl } = stubFetch(() => json({ error: { code: "ROUTE_NOT_FOUND" } }, 404));
    const r = await runWaveCli(["models"], { ...opts, fetchImpl });
    expect(r.code).toBe(1);
    expect(r.out).toBe("");
    expect(r.err).toBe("wave-sdk models: models: upstream 404 (ROUTE_NOT_FOUND)\n");
  });

  it("redaction ignores implausibly short tokens instead of mangling the message", () => {
    expect(redact("models: upstream 404", "t")).toBe("models: upstream 404");
    expect(redact("key wave_live_SECRET123 bad", "wave_live_SECRET123")).toBe("key [redacted] bad");
  });

  it("an upstream message cannot add lines or terminal escapes to the one-line error", async () => {
    const { fetchImpl } = stubFetch(() =>
      json({ error: { code: "BAD", message: "line one\nFAKE: injected\r\u001b[2Kcleared" } }, 400));
    const r = await runWaveCli(["models"], { ...opts, fetchImpl });
    expect(r.code).toBe(1);
    expect(r.err?.endsWith("\n")).toBe(true);
    const line = r.err?.slice(0, -1) ?? "";
    for (const ch of ["\r", "\n", "\u001b"]) expect(line.includes(ch)).toBe(false);
    expect(r.err).toContain("line one FAKE: injected [2Kcleared");
  });

  it("the API key never reaches the terminal, even if an upstream echoes it", async () => {
    const secret = "wave_live_SECRET123";
    const { fetchImpl } = stubFetch(() => new Response(`bad key ${secret}`, { status: 401 }));
    const r = await runWaveCli(["complete", "--model", "m", "hi"], { ...opts, token: secret, fetchImpl });
    expect(r.code).toBe(1);
    expect(r.err).not.toContain(secret);
    expect(r.err).toContain("[redacted]");
  });

  it("complete sends the key as a Bearer token and the --model flag as the model", async () => {
    const { calls, fetchImpl } = stubFetch(() =>
      json({ id: "c", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] }));
    const r = await runWaveCli(["complete", "--model=qwen2.5:3b", "say", "ok"], { ...opts, fetchImpl });
    expect(r).toEqual({ code: 0, out: "ok\n" });
    expect(calls[0].url).toBe("https://api.wave.online/v1/inference/chat/completions");
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe(`Bearer ${TOKEN}`);
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe("qwen2.5:3b");
    expect(body.messages).toEqual([{ role: "user", content: "say ok" }]);
  });

  it("--model with no value is a usage error, never a silent fallback to another model", async () => {
    for (const argv of [["complete", "hi", "--model"], ["complete", "--model", "--x", "hi"], ["stream", "-m"], ["complete", "--model=", "hi"]]) {
      const { calls, fetchImpl } = stubFetch(() => json({ data: [{ id: "other-model" }] }));
      const r = await runWaveCli(argv, { ...opts, fetchImpl });
      expect(r.code).toBe(2);
      expect(r.err).toMatch(/--model needs a value/);
      expect(calls).toHaveLength(0);
    }
  });

  it("complete without --model or WAVE_MODEL uses the first model the door lists", async () => {
    const { calls, fetchImpl } = stubFetch((url) =>
      url.endsWith("/models")
        ? json({ data: [{ id: "first-model" }, { id: "second" }] })
        : json({ choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }] }));
    const r = await runWaveCli(["complete", "hello"], { ...opts, fetchImpl });
    expect(r.code).toBe(0);
    expect(JSON.parse(calls[1].init.body as string).model).toBe("first-model");
  });

  it("complete, stream and transcripts refuse to run without a key, pointing at WAVE_API_KEY", async () => {
    for (const argv of [["complete", "hi"], ["stream", "hi"], ["transcripts", "list", "org_1"]]) {
      const r = await runWaveCli(argv, { ...opts, token: undefined });
      expect(r.code).toBe(2);
      expect(r.err).toMatch(/set WAVE_API_KEY/);
    }
  });

  it("help prints usage with exit 0 and documents the env vars", async () => {
    for (const cmd of ["help", "--help", "-h"]) {
      const r = await runWaveCli([cmd], opts);
      expect(r.code).toBe(0);
      expect(r.out).toContain("usage: wave-sdk");
      expect(r.out).toContain("WAVE_API_KEY");
    }
  });

  it("unknown command returns usage + exit 2", async () => {
    const r = await runWaveCli(["bogus"], opts);
    expect(r.code).toBe(2);
    expect(r.out).toContain("usage: wave");
  });

  it("complete without a prompt returns usage + exit 2", async () => {
    const r = await runWaveCli(["complete"], opts);
    expect(r.code).toBe(2);
  });

  it("stream without a prompt returns usage + exit 2", async () => {
    const r = await runWaveCli(["stream"], opts);
    expect(r.code).toBe(2);
  });
});

describe("cliOptionsFromEnv (what the wave-sdk bin reads)", () => {
  it("defaults to the gateway's inference door (WAVE-key auth) and the API gateway", () => {
    expect(cliOptionsFromEnv({})).toEqual({
      baseUrl: DEFAULT_RUNTIME_URL,
      apiBaseUrl: DEFAULT_API_BASE_URL,
      token: undefined,
      model: undefined,
    });
    expect(DEFAULT_RUNTIME_URL).toBe("https://api.wave.online/v1/inference");
    expect(DEFAULT_API_BASE_URL).toBe("https://api.wave.online");
  });

  it("reads WAVE_API_KEY, WAVE_MODEL, WAVE_RUNTIME_URL and WAVE_BASE_URL", () => {
    expect(
      cliOptionsFromEnv({
        WAVE_API_KEY: "k",
        WAVE_MODEL: "m",
        WAVE_RUNTIME_URL: "http://localhost:1/v1",
        WAVE_BASE_URL: "http://localhost:2",
      }),
    ).toEqual({ baseUrl: "http://localhost:1/v1", apiBaseUrl: "http://localhost:2", token: "k", model: "m" });
  });
});
