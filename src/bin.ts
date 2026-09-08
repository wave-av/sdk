#!/usr/bin/env node
/**
 * `wave-sdk` bin entry point.
 *
 * This file exists SOLELY to be the executable named in package.json's "bin" field. It has no
 * exports consumed by anything else in the package, so tsup/esbuild never folds it into a shared
 * chunk — unlike the old approach (a top-level `if (require.main === module)` guard living inside
 * `src/cli.ts`, which is also re-exported from `src/index.ts`). That guard used a CJS-only idiom
 * (`module` has no meaning in ES module scope) and, once shared across entries via ESM code
 * splitting, threw `ReferenceError: module is not defined in ES module scope` for *any* ESM
 * consumer of `@wave-av/sdk` — including a plain `import '@wave-av/sdk'` with no CLI usage at all.
 *
 * Because this module is only ever loaded as the process entry (never imported as a library), it
 * runs unconditionally — no entry-point guard is needed here, ESM-safe or otherwise.
 */
import { runWaveCli } from "./cli";

void runWaveCli(process.argv.slice(2), { baseUrl: "https://api.wave.online" }).then((r) => {
  process.stdout.write(r.out ?? "");
  process.exit(r.code ?? 0);
});
