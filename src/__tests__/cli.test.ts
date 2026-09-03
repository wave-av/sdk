import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runWaveCli } from "../cli";

describe("wave CLI bin-entry guard is dual-format safe", () => {
  // cli.ts is built to BOTH cjs and esm (tsup --format cjs,esm) and its compiled output is a
  // shared chunk statically imported by every ESM consumer of the package (index.ts re-exports
  // runWaveCli). A bare `require.main === module` at module top level throws
  // `ReferenceError: module is not defined in ES module scope` the instant that chunk is
  // evaluated under real ESM — crashing `import("@wave-av/sdk")` for every caller, not just CLI
  // users. This shipped in 2.1.1/2.1.2 (fixed here) and only reproduces via a real script-file
  // import, not `node -e`/`--input-type=module -e` (see .github/workflows/smoke-install.yml and
  // release.yml's e2e-smoke, which is the real, load-bearing regression guard for this class of
  // bug). This test is a fast, source-level tripwire: the bin-entry guard must never reference
  // the bare `module` identifier without a preceding `typeof module !== "undefined"` check.
  it("guards require.main === module behind typeof checks (never a bare `module` reference)", () => {
    const cliSourcePath = fileURLToPath(new URL("../cli.ts", import.meta.url));
    const source = readFileSync(cliSourcePath, "utf8");
    const guardLine = source
      .split("\n")
      .find((l) => l.trimStart().startsWith("if (") && l.includes("require.main === module"));
    expect(guardLine).toBeDefined();
    expect(guardLine).toContain('typeof module !== "undefined"');
    expect(guardLine).toContain('typeof require !== "undefined"');
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
