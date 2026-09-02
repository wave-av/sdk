# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Breaking**: `CreateClipRequest.source` is now a recording-id string with top-level `in`/`out` time strings; the old discriminated `{ type: 'stream' | 'recording' | 'upload', id, start_time, end_time }` source object is gone, so clips can no longer be created from `stream`/`upload` sources (the live gateway rejects that shape). **Breaking**: `voice.synthesize()` now returns `Promise<ArrayBuffer>` (raw `audio/mpeg` bytes) instead of a JSON `SynthesisResult` job object.

### Fixed
- **SDK contract aligned to the LIVE gateway** (verified against `api.wave.online`): `clips.create()` now sends the gateway-accepted shape `{ source: "<recording-id>", in: "5s", out: "10s", title? }` (previously sent a rejected `{ source: { type, id, start_time, end_time } }` object). `voice.synthesize()` now POSTs `/v1/voice` and returns the raw `audio/mpeg` bytes (previously POSTed `/v1/voice/synthesize` and expected a JSON job object). `ClipSource` and `SynthesizeRequest` types updated to match the verified live contract.
- `voice.synthesize()` goes through the standard client request path: the full `SynthesizeRequest` (including audio options) is forwarded, and retries, rate-limit handling, timeouts, custom headers, and `WaveError`-typed failures now apply (previously a bare `fetch` that sent only `text`/`voice_id` and threw generic `Error`s).

