/**
 * Fresh-install / packed-tarball regression test for the ESM entry-guard incident.
 *
 * `@wave-av/sdk@2.1.0`–`2.1.2` shipped a top-level `if (require.main === module)` bin-entry
 * guard inside `src/cli.ts`. Because `cli.ts` is re-exported from `src/index.ts`, tsup/esbuild's
 * ESM code-splitting placed that guard in a chunk shared by every ESM entry (`dist/index.mjs`,
 * `dist/cli.mjs`, ...). `module` has no meaning in ES module scope, so a plain
 * `import '@wave-av/sdk'` from ANY ESM consumer (e.g. `@wave-av/cli`, itself `"type": "module"`)
 * threw `ReferenceError: module is not defined in ES module scope` before argv parsing even
 * started.
 *
 * This test packs the CURRENT source into a real tarball (`npm pack`), installs it into an
 * isolated temp directory the way a real user would (`npm install <tarball>`), and then exercises
 * it exactly the way the broken release failed in production:
 *   1. A genuine ESM module statically importing the package (not a dynamic `import()` called
 *      from a CommonJS context — that path does NOT reproduce the bug on this Node version).
 *   2. The published bin, invoked with `--help`.
 *
 * It is slow (a real build + pack + install), so it is skipped unless RUN_PACK_SMOKE=1 — run it
 * explicitly with `RUN_PACK_SMOKE=1 npx vitest run src/__tests__/pack-esm-smoke.test.ts`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

const RUN = process.env.RUN_PACK_SMOKE === "1";
const pkgRoot = join(__dirname, "..", "..");

describe.skipIf(!RUN)("fresh install of the packed tarball (ESM entry-guard regression)", () => {
  let workDir: string;
  let installDir: string;
  let tarballPath: string;

  beforeAll(() => {
    // Build the CURRENT source so the tarball reflects the fix under test, not a stale dist/.
    execFileSync("npm", ["run", "build"], { cwd: pkgRoot, stdio: "pipe" });

    workDir = mkdtempSync(join(tmpdir(), "wave-sdk-pack-"));
    const packOut = execFileSync(
      "npm",
      ["pack", "--pack-destination", workDir, "--json"],
      { cwd: pkgRoot, encoding: "utf8" },
    );
    const [{ filename }] = JSON.parse(packOut) as { filename: string }[];
    tarballPath = join(workDir, filename);
    expect(existsSync(tarballPath)).toBe(true);

    installDir = join(workDir, "install");
    mkdirSync(installDir, { recursive: true });
    writeFileSync(
      join(installDir, "package.json"),
      JSON.stringify({ name: "smoke", version: "0.0.0", private: true }, null, 2) + "\n",
    );
    execFileSync("npm", ["install", tarballPath, "--no-audit", "--no-fund"], {
      cwd: installDir,
      stdio: "pipe",
    });
  }, 120_000);

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it("a static ESM import of the installed package does not throw", () => {
    const probePath = join(installDir, "probe.mjs");
    writeFileSync(
      probePath,
      'import * as sdk from "@wave-av/sdk";\n' +
        'if (typeof sdk.WaveClient !== "function") throw new Error("WaveClient missing");\n' +
        'process.stdout.write("PROBE_OK\\n");\n',
    );
    const out = execFileSync("node", [probePath], { cwd: installDir, encoding: "utf8" });
    expect(out).toContain("PROBE_OK");
  });

  it("the installed bin runs (no ReferenceError, no import-time crash)", () => {
    const binPath = join(installDir, "node_modules", "@wave-av", "sdk", "dist", "bin.js");
    expect(existsSync(binPath)).toBe(true);
    // No subcommand -> the CLI's own usage/exit-2 path (not a `--help` flag) is the code path
    // exercised here; the regression under test is the ESM-import ReferenceError crashing the
    // process before argv is even parsed, not this CLI's own exit code semantics.
    const result = spawnSync("node", [binPath], { cwd: installDir, encoding: "utf8" });
    expect(result.stderr).not.toContain("ReferenceError");
    expect(result.stderr).not.toContain("module is not defined");
    expect(result.stdout).toContain("usage: wave-sdk");
    expect(result.status).toBe(2); // known usage exit code, not a crash (null/1 from an uncaught throw)
  });

  it("no bin named plain `wave` ships from the SDK package (collision avoidance)", () => {
    const binDir = join(installDir, "node_modules", ".bin");
    expect(existsSync(join(binDir, "wave-sdk"))).toBe(true);
    expect(existsSync(join(binDir, "wave"))).toBe(false);
  });
});
