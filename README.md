<div align="center">

# sdk

**Official TypeScript SDK for the WAVE API — 42 API module subpaths covering streaming, production, device management, analytics, content, and monetization behind a single `Wave` client. Most modules are SDK-side TypeScript surface only; see capability statuses for what has a live fleet backend today.**

![kind](https://img.shields.io/badge/kind-library-555?style=flat-square) ![domain](https://img.shields.io/badge/domain-sdk-0a7?style=flat-square) ![lang](https://img.shields.io/badge/lang-TypeScript-3178c6?style=flat-square) ![visibility](https://img.shields.io/badge/visibility-public-brightgreen?style=flat-square)

[docs](https://docs.wave.online/sdk) · [npm](https://www.npmjs.com/package/@wave-av/sdk) · [repo](https://github.com/wave-av/sdk) · [Docs](https://docs.wave.online) · [Status](https://wave.online/status)

</div>

> This README is machine-generated from WAVE's grounded Single Source of Truth — every
> factual claim below traces to a resolver that `npm run verify` checks against the live
> repo and live endpoints. Nothing here is asserted without a receipt.

---

## Quick start

```bash
npm install @wave-av/sdk
```

```ts
import { Wave } from "@wave-av/sdk";

const wave = new Wave({
  apiKey: process.env.WAVE_API_KEY!,
  organizationId: "org_123",
});

// Create and start a live stream
const stream = await wave.pipeline.create({
  title: "My Live Stream",
  protocol: "webrtc",
  recording_enabled: true,
});
await wave.pipeline.start(stream.id);

// Text-to-speech (returns raw audio/mpeg bytes as an ArrayBuffer)
const audio = await wave.voice.synthesize({
  text: "Hello from WAVE",
  voice_id: "voice_abc",
});
```

## Capabilities
- **Pricing Pages** — create/list/read tier manifests (pricing.wave.online/<slug> hosted pages; scopes pricing:write/pricing:read)

| Capability | Status |
| --- | --- |
| Auto-captions, translation, burn-in via `wave.captions` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video clips, exports, AI highlights via `wave.clips` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Monetization, subscriptions, tips, payouts via `wave.creator` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Video editing, tracks, transitions, effects via `wave.editor` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Desktop Node fleet management, health, commands via `wave.fleet` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| x402 and MPP card-rail agent payments with scope-gate and settlement-guard, shipped at the WAVE gateway; reachable from the SDK today via the base `WaveClient` request methods (no dedicated wrapper module yet) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| AI auto-directing (Autopilot), suggestions, overrides via `wave.ghost` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-region failover, replication, topology via `wave.mesh` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Telephony bridging via `wave.phone` — core features are planned in the fleet SSOT, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Live stream lifecycle, protocols, recordings, viewer metrics via `wave.pipeline` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Podcast publishing/distribution via `wave.podcast` — core features are planned in the fleet SSOT, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) via `wave.prism` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Analytics, BI dashboards, revenue metrics via `wave.pulse` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-camera production, scenes, transitions, graphics, audio mixing via `wave.studio` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Transcription with speaker diarization via `wave.transcribe` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent email send, reply, search, transcript email, and SMS via `wave.mail` (E5 comms productization; x402-USDC-settled sub-cent sends) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| Usage metering ledger and rollup by channel (mail/voice/sms/realtime/storage) via `wave.meter` (requires `meter:read` scope) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| Recording storage, VOD, archive policies via `wave.vault` (SDK TypeScript surface; no fleet backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Text-to-speech via `wave.voice.synthesize()`; voice-clone methods exist as SDK client surface but are not backed by the wave-voice product yet | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent routing (route/pool) and an OpenAI-compatible proxy for LLM/agent traffic, shipped at the WAVE gateway; reachable from the SDK today via the base `WaveClient` request methods (no dedicated wrapper module yet) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |

## The receipts

Every claim below is checked by `npm run verify` against the live repo or endpoint — a non-`pass` verdict fails the gate.

| Claim | How it's verified |
| --- | --- |
| The base WaveClient exposes a generic protected request() method that any endpoint — including gateway/dispatch routes without a dedicated wrapper module — can be reached through | resolved by grepping `src/client.ts` |
| Documentation surface is docs.wave.online | resolved by grepping `package.json` |
| Licensed Apache-2.0 | resolved by grepping `package.json` |
| 42 independently-importable API module subpaths are declared under package.json exports, plus the package root | resolved by grepping `package.json` |
| Requires Node.js &gt;=18.0.0 | resolved by grepping `package.json` |
| The npm package is published as @wave-av/sdk | resolved by grepping `package.json` |
| Current package.json version is 2.1.0-next.0 | resolved by grepping `package.json` |
| Each API module is independently importable via a package.json subpath export (e.g. @wave-av/sdk/pipeline) | resolved by grepping `package.json` |
| wave.voice.synthesize() implements text-to-speech; the SDK also declares cloneVoice() client methods that are not backed by the wave-voice product | resolved by grepping `src/voice.ts` |
| A single `Wave` client class in src/index.ts composes every API module as a readonly property | resolved by grepping `src/index.ts` |
| Takes zod ^3.22.0 as a peer dependency for runtime validation | resolved by grepping `package.json` |

## Topics

`sdk` · `typescript` · `streaming` · `video` · `audio` · `production` · `webrtc` · `ndi` · `srt` · `clips` · `voice` · `transcription` · `captions` · `analytics`

---

<div align="center">

**Built by [WAVE Online, LLC](https://wave.online)** · [wave.online](https://wave.online) · [Docs](https://docs.wave.online) · [LinkedIn](https://www.linkedin.com/company/wave-online)

</div>


## The `wave` CLI

The SDK ships a CLI. Install globally and script WAVE from your terminal or agent:

```bash
npm install -g @wave-av/sdk@next
wave --help
```

The CLI is a thin arg parser over the same `RuntimeClient` the SDK exports, so every
command maps 1:1 to the API surface. Agents can call it without building integrations.
