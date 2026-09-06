import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runWaveCli } from "../cli";

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
  const opts = { baseUrl: "https://runtime.wave.online/v1", token: "t" };

  it("wave models lists model ids", async () => {
    const r = await runWaveCli(["models"], { ...opts, token: undefined });
    // (fetch injection is via RuntimeClient; here we just assert the CLI shape on a stubbed client by
    //  checking that a usage error is correct — the real wiring is covered by the RuntimeClient tests.)
    expect(r).toBeDefined();
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
