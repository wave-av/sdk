# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.3] - 2026-09-01

### Fixed

- **P0: fresh installs of `@wave-av/sdk@2.1.x` crashed every ESM consumer at import time.**
  `src/cli.ts` carried a top-level bin-entry guard, `if (require.main === module) { ... }`,
  a CJS-only idiom. Because `src/cli.ts` is also re-exported from `src/index.ts` (for
  `runWaveCli`), tsup/esbuild's ESM code-splitting placed it in a chunk shared by every ESM
  entry point (`dist/index.mjs`, `dist/cli.mjs`, ...). `module` has no meaning in ES module
  scope, so evaluating that shared chunk threw
  `ReferenceError: module is not defined in ES module scope` for *any* ESM import of the
  package — not just when the `wave` bin was executed. This broke `@wave-av/cli@1.0.8`
  (which resolves `@wave-av/sdk` via `^2.0.11` → 2.1.2, and is itself an ESM package, so it
  always takes the `"import"` condition) on every fresh install.
  Reproduced with: `node --input-type=module -e "import('@wave-av/sdk')"` (throws on 2.1.0
  through 2.1.2; works from 2.0.14 backward because the guard was added by the CLI-bin work
  landing in 2.1.0).
- The bin-entry side effect now lives in `src/bin.ts`, a file with no exports consumed
  elsewhere in the package. It is never re-exported, so tsup/esbuild never folds it into a
  shared chunk, and because it only ever runs as the process entry point it needs no
  entry-point guard at all (ESM-safe or otherwise) — it just runs.
- `src/cli.ts` is now a pure library module: `runWaveCli` with zero top-level side effects.

### Changed

- **BREAKING (bin rename):** the package's `bin` field changed from `"wave": "./dist/cli.js"`
  to `"wave-sdk": "./dist/bin.js"`. `@wave-av/sdk` and `@wave-av/cli` both declared a bin
  named `wave`, so which package's `wave` binary actually landed in `node_modules/.bin` was
  install-order luck — and the SDK's version was a 4-verb stub (`wave <models|complete|
  stream|products>`), not the full 34-command-group CLI that `@wave-av/cli` ships. If you
  depended on the SDK's own `wave` bin directly (not via `@wave-av/cli`), invoke it as
  `wave-sdk` after upgrading, or run it via `npx @wave-av/sdk` command name `wave-sdk`.

### Release note

Publishing `@wave-av/sdk@2.1.3` to npm is a separate, manual operator step. This change does
not run `npm publish`.
