# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Version 3.0.0. A major bump because this release carries the breaking `clips.create()` and
`voice.synthesize()` changes already on `main` (see Changed below), plus the connectivity fixes
in this section. Each fix was checked against `api.wave.online` with a WAVE API key; the PR
that introduced this entry lists the request ids.

### Fixed (connectivity)

- **The README quickstart now runs.** It led with `wave.pipeline.create()`, and the gateway
  serves no `/v1/streams` route (`404 ROUTE_NOT_FOUND`). The quickstart now uses routes the
  gateway serves: `wave.inference.models()` / `complete()`, `wave.meter.ledger()` and
  `wave.realtime.history()`. `pipeline`, `editor`, `collab` and `mail` are marked `planned`
  in the README and `.wave/repo.json` (`mail` was marked `ga`; every mail route answers
  `404 ROUTE_NOT_MAPPED`).
- **`wave.realtime` reaches the gateway.** It targeted `realtime.wave.online`, which has no DNS
  record. The socket and the REST calls now derive from the client's `baseUrl`
  (`https://api.wave.online/v1/realtime`, `wss://` for the socket), so a custom `baseUrl` moves
  realtime too. The API key no longer rides in the socket URL as `?access_token=`: the
  handshake sends `Authorization: Bearer` (Node 22+ and Bun do this natively; pass
  `webSocketFactory` elsewhere). `publish`, `presence` and `history` go through `WaveClient`,
  so a non-2xx answer throws a typed `WaveError` instead of resolving with the error body.
  Channel names are checked against the gateway's pattern before any network call.
- **`wave.inference` uses the WAVE API key.** `models()` and `profile()` always threw
  (`Failed to parse URL from /rest/v1/models`) because they read config fields the client never
  kept, and were built to query WAVE's internal model registry with a database key.
  `complete()` posted to a LiteLLM host that rejects WAVE keys. Both now call the gateway:
  `POST /v1/inference/chat/completions` and `GET /v1/inference/models`. `profile()` has no
  served route yet and throws `RouteNotServedError` without a network call.
- **Errors keep the gateway's code.** The gateway answers in three envelopes; the SDK read only
  the nested one, so a spend-cap 402 surfaced as `HTTP_402 "Payment Required"`. `WaveError`
  now reads the nested, flat and x402 shapes. New subclasses: `PaymentRequiredError` (402,
  with the x402 `accepts[]` when present) and `RouteNotServedError` (404 `ROUTE_NOT_FOUND` /
  `ROUTE_NOT_MAPPED`). `required_scope`, `available_scopes`, `suggestions`, `next_action` and
  `doc_url` land in `details` beside the envelope's own `error.details`, which passes through
  as before. From the rest of the body only that allowlist is copied.
- **The `wave-sdk` CLI works.** It never read an API key, called `https://api.wave.online/models`
  (no `/v1`, so 404), and crashed with a stack trace on any failure. It now reads
  `WAVE_API_KEY`, `WAVE_MODEL`, `WAVE_RUNTIME_URL` and `WAVE_BASE_URL`, defaults to the
  gateway's `/v1/inference` door, prints one redacted line and exits 1 on failure, and answers
  `--help`. The README documented a `wave` command; the bin has been `wave-sdk` since 2.1.3.
- `voice.synthesize()` sends `voice_id` as `voiceId`, the field the voice edge reads, so a
  chosen voice is no longer silently replaced by the default one.
- `wave.meter` types match the gateway's v0 contract: the ledger is one window
  (`{ org, from, to, channels, generated_at, tier? }`), not `{ rows: [...] }`; `blocked` is a
  reason string, not a count; the rollup carries `period`.
- `User-Agent` carries the real version (`wave-sdk-typescript/3.0.0`), not `1.0.0`.
- `package.json` `homepage` pointed at `https://docs.wave.online/sdk`, which returns 404; it
  now points at this README.
- **The README captions, transcription and clips examples now run.** The gateway forwards
  `/v1/captions`, `/v1/transcribe`, `/v1/clips` and `/v1/voice` whole to a product edge, and
  the SDK's shapes for those modules had never matched the edges. With 2.1.3 the README flows
  failed at step 1: `captions.generate()` posts `/v1/captions/generate` (`405`), and
  `transcribe.create()` sends snake_case fields the edge rejects (`400 sourceId is required`).
  The served routes are now called with the edges' own contracts:
  - `captions.create({ videoId, sourceLanguage?, targetLanguages?, style?, speakerLabels? })`
    (`POST /v1/captions`), `captions.download(id, { language, format })`, and `get` / `list` /
    `remove` / `getText` / `waitForReady` on `CaptionJob`.
  - `transcribe.create({ sourceId, sourceType, language?, speakerLabels?, wordTimestamps?,
    punctuation?, model? })` (`POST /v1/transcribe`), with `get` / `list` / `remove` /
    `getText` / `waitForReady` on the served `Transcription`.
  - `clips.create()` returns what the engine answers (`{ clipId, assets[], clip, ... }`), not a
    `Clip` whose `id` was undefined; `clips.detect({ videoId, ... })` (`POST /v1/clips/detect`)
    replaces `detectHighlights()`, which posted to a path nothing serves; `waitForReady()`
    recognises the engine's `completed` status instead of polling to its 5-minute timeout.
  - `voice.listVoices()` returns `Voice[]` from the edge's `{ voices }` body, and
    `voice.cloneVoice({ name, audioFiles, ... })` sends the fields `POST /v1/voice/clone` reads.
- **Methods whose route no backend serves fail fast and typed.** On those four modules, every
  method whose path the owning edge does not serve (for example `captions.translate()`,
  `clips.exportClip()`, `transcribe.getSegments()`, `voice.getSynthesis()`) is deprecated and
  throws `RouteNotServedError` (code `ROUTE_NOT_SERVED`) before any network call. Before, they
  reached the edge and came back as a bare `HTTP_404` / `HTTP_405`.
- Ten modules the route sweep measured unserved (every GET `ROUTE_NOT_FOUND` /
  `ROUTE_NOT_MAPPED` with a key) move from `sdk-surface` to `planned`: `audience`, `desktop`,
  `distribution`, `drm`, `marketplace`, `notifications`, `qr`, `signage`, `slides`, `usb`.
  `wave.transcripts`, which the module tables did not list, is added as `planned` (its
  `/v1/realtime/agents/transcripts` routes answer `404 ROUTE_NOT_FOUND` with a key).

### Added (connectivity)

- `scripts/route-sweep.mjs`: extracts every route each SDK method sends, probes each one on the
  gateway (GETs with a key when `--key-env` is given, everything else without one), and compares
  each module's measured state with its status in `.wave/repo.json`. `--check` fails when a
  module marked `lib` or `ga` measures unserved.
- `scripts/smoke-live.mjs --media` runs the README transcription and captions flows end to end
  on a 3-second public speech sample, and the smoke checks the clips, captions, transcribe and
  voice list reads.

- Subpath exports `@wave-av/sdk/inference`, `@wave-av/sdk/perception` and
  `@wave-av/sdk/transcripts`. `InferenceAPI`, `SDK_VERSION`, `PaymentRequiredError` and
  `RouteNotServedError` from the package root; `parseErrorBody` and `createWaveError` from
  `@wave-av/sdk/client`.
- `scripts/smoke-live.mjs`: a strict live check. The known-served controls must answer 200,
  every quickstart call must answer 200, and unserved or capped routes must surface as the
  right typed error. `scripts/smoke-quickstart.mjs` now runs the new quickstart.

### Changed (connectivity)

- **Breaking**: `MeterLedger` is `{ org, from, to, channels, generated_at, tier? }`
  (`MeterLedgerRow` stays as a deprecated alias). `MeterSmsChannel.blocked` is a string.
- **Breaking**: `inference.models()` returns `{ id, ownedBy }[]` from the gateway instead of
  registry rows with prices.
- **Breaking**: `RealtimeAPI.connect()` needs a WebSocket that can send headers (Node 22+, Bun,
  or `webSocketFactory`); a browser must open the socket from a server.
- `RuntimeClient` sends its token on `models()` too (the gateway door needs it), reports the
  gateway's error `code` and `details` on `RuntimeError`, redacts its token from error messages,
  and `stream()` asks for `stream_options.include_usage` (kept when other stream options are
  passed). When a door answers `text/event-stream` to `stream: false`, tool-call deltas are
  merged into the completion, and a body with no decodable frame throws instead of returning an
  empty answer.
- `inference.complete()` and `realtime.publish()` are not retried: both are non-idempotent (a
  completion is billed), so a timeout or 5xx after the gateway acted must not repeat the call.
  Every read keeps the client's retry policy. The same now holds for the billed media calls:
  `clips.create()`, `clips.detect()`, `captions.create()`, `transcribe.create()`,
  `voice.synthesize()` and `voice.cloneVoice()`.
- **Breaking**: `Clip`, `CreateClipRequest`, `UpdateClipRequest`, `ListClipsParams`,
  `Transcription`, `CreateTranscriptionRequest`, `ListTranscriptionsParams`,
  `TranscriptionSegment`, `TranscriptionWord`, `TranscriptionModel`, `Voice`,
  `CloneVoiceRequest` and `ListVoicesParams` take the served (camelCase) shapes;
  `ClipQuality` is `'720p' | '1080p' | '4k'`. `clips.create()` returns `ClipCreateResult`,
  `clips.list()` `ClipList`, `captions.get()` / `list()` `CaptionJob` / `CaptionJobList`,
  `transcribe.list()` `TranscriptionList`, `voice.listVoices()` `Voice[]`. The old types stay
  exported (deprecated) where a gated method still names them.
- The ESLint config lets a deprecated method keep a `_`-prefixed parameter it no longer reads,
  so callers of the gated methods still compile.
- x402 challenges: the message comes from the gateway's `error_detail.message` when present, and
  `error_detail` is kept in `details`.

### Fixed

- `pr-agent` lane: fork-triggered `/` commands are now refused, and the AI
  call's budget fits inside its step. Three defects, one of them only visible
  once the first was fixed.

  The job-level `if:` refused forks on the `pull_request` arm and could not on
  `issue_comment` — fork status is absent from that payload, so there was never
  an expression to write. A `fork gate` step now asks the pulls endpoint and
  fails closed: only a literal `false` proceeds, so a 404, a rate limit or a
  deleted fork all skip. The lane runs no `actions/checkout`, so fork code was
  never executed and no exfiltration path existed; what this closes is the
  comment claiming forks were already skipped, which was true of one arm only.

  `CONFIG__AI_TIMEOUT` was 600s inside a 360s step, so the runner killed the
  step before pr-agent could reach its own timeout or fall back to a secondary
  model. Now 300s.

  Fixing the first exposed a third: `stamp attempt 2 end` runs under
  `if: always()`, so when attempt 2 never ran the verdict subtracted from zero
  and reported a 1787580408-second attempt as a confident TIMED OUT.

  Contributors on forks are affected: a maintainer's `/review` on a fork PR is
  now declined with a warning rather than silently running.
  (wave-av/wave-foundation-public#73)

### Added

- `@wave-av/sdk/compose`: `compose(intent, options)` calls `POST /v1/compose` (the WAVE Composer's proposal endpoint) and returns the typed `ComposeProposal`; `saveFlow(proposal, options)` posts a composed proposal to the console flows door with `createdBy.kind: "wave-composer"`. Both are STANDALONE functions (no `Wave` client instance required), matching the `agent-auth.ts` convention. `compose()` calls exactly one route, ever — the response's `executes` field is always `false`, never derived. `saveFlow()` requires a `consoleToken` (the console's `composer:write`-scoped machine-auth token has not shipped yet); without one it throws `ConsoleAuthRequiredError` carrying the exact `curl` a signed-in human can run, never a silent no-op.
- `src/compose-types.ts`: the wire-contract types (`ComposeRequest`, `ComposeProposal`, `ComposeStage`, `ComposeScopeRow`, `ComposePriceRow`, `ComposeCallShape`, `ComposeEngineInfo`), copied verbatim from the gateway's `feat/compose-engine` branch (not hand-derived), plus `isQuotedPriceRow()`, a type-guard matching the same discriminator `wave-av/cli` PR #61 defines locally against the identical shape.
- `schema/compose.schema.json`: a JSON Schema generated from `src/compose-types.ts` via the new `npm run schema:generate` script (`ts-json-schema-generator`), so the SDK's types cannot hand-drift from what it declares as the wire contract. The gateway itself does not publish a JSON Schema for this contract yet (its `feat/compose-engine` branch validates with TypeScript types only) — this schema should move to the gateway once it does, so every rendering (API, CLI, SDK, MCP) generates from one published source instead of three independently-generated copies.
- New devDependencies: `ts-json-schema-generator` (schema generation), `ajv` (test-only, schema round-trip validation).

### Changed
- **Breaking**: `CreateClipRequest.source` is now a recording-id string with top-level `in`/`out` time strings; the old discriminated `{ type: 'stream' | 'recording' | 'upload', id, start_time, end_time }` source object is gone, so clips can no longer be created from `stream`/`upload` sources (the live gateway rejects that shape). **Breaking**: `voice.synthesize()` now returns `Promise<ArrayBuffer>` (raw `audio/mpeg` bytes) instead of a JSON `SynthesisResult` job object.

### Fixed
- **SDK contract aligned to the LIVE gateway** (verified against `api.wave.online`): `clips.create()` now sends the gateway-accepted shape `{ source: "<recording-id>", in: "5s", out: "10s", title? }` (previously sent a rejected `{ source: { type, id, start_time, end_time } }` object). `voice.synthesize()` now POSTs `/v1/voice` and returns the raw `audio/mpeg` bytes (previously POSTed `/v1/voice/synthesize` and expected a JSON job object). `ClipSource` and `SynthesizeRequest` types updated to match the verified live contract.
- `voice.synthesize()` goes through the standard client request path: the full `SynthesizeRequest` (including audio options) is forwarded, and retries, rate-limit handling, timeouts, custom headers, and `WaveError`-typed failures now apply (previously a bare `fetch` that sent only `text`/`voice_id` and threw generic `Error`s).


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
