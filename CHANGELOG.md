# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.3] - 2026-09-01

### Added

- Standalone functions for the agent-auth device authorization ceremony: `startAgentCeremony`, `pollAgentCeremony`, `refreshAgentCeremony`, plus the `isCeremonyPending` and `isCeremonyTerminal` classifiers (#110). These take no client and no API key, so an SDK consumer can run the full bootstrap and hand a human an approval URL before any credential exists.

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

## [2.1.2] - 2026-08-28

### Fixed

- The published `wave` CLI binary was a silent no-op: the entry point exported `runWaveCli` but never invoked it (#105).

## [2.1.1] - 2026-08-28

### Fixed

- Republished the identical 2.1.0 tree under a new version number after the `sdk-v2.1.0` tag was cut from a stale pre-merge commit (#103, #104).

## [2.1.0] - 2026-08-27

Prereleased as `2.1.0-next.0` through `2.1.0-next.4` (2026-07-02, 2026-08-27) before this stable tag.

### Added

- `wave` CLI, published as a package bin (#99).
- `RuntimeClient`, a typed client for the OpenAI-compatible runtime endpoint (#76).
- Mail and meter client modules (#78).
- `ProductClient`, a catalog-driven client covering all product surfaces (#82).
- `PricingAPI` for creating, listing, and reading pricing tier manifests (#85).
- `TranscriptAPI` for listing and reading voice-agent transcripts (#87).
- `CommsAPI.createTenant` for tenant onboarding (#91).
- `WebhooksAPI.registerTenantWebhook` (#93).
- `CommsAPI.listTenants` (#95).
- An inference client module (#97).
- A typed WAVE Realtime client, `wave.realtime` (#15).
- A live-media perception `subscribe()` client (#42).

### Changed

- Relicensed under Apache-2.0 and added a NOTICE file reserving the WAVE marks (#18). No API or build changes.

## [2.0.0] - [2.0.14]

Published 2026-04-01 through 2026-04-03 (registry `time` map: `2.0.0` at 2026-04-01T23:58:46Z,
`2.0.1` through `2.0.14` following on 2026-04-02/03). No merged-PR history is available in this
repository to anchor individual 2.0.x versions to specific changes. Only the `v2.0.1` git tag
(2026-04-02) exists; `2.0.0` was published to npm with no corresponding git tag.

[Unreleased]: https://github.com/wave-av/sdk/compare/sdk-v2.1.3...HEAD
[2.1.3]: https://github.com/wave-av/sdk/compare/sdk-v2.1.2...sdk-v2.1.3
[2.1.2]: https://github.com/wave-av/sdk/compare/sdk-v2.1.1...sdk-v2.1.2
[2.1.1]: https://github.com/wave-av/sdk/compare/sdk-v2.1.0...sdk-v2.1.1
[2.1.0]: https://github.com/wave-av/sdk/compare/v2.0.1...sdk-v2.1.0
[2.0.1]: https://github.com/wave-av/sdk/releases/tag/v2.0.1
[2.0.0]: https://www.npmjs.com/package/@wave-av/sdk/v/2.0.0
