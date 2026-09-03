<div align="center">

# sdk

**Media infrastructure for the agentic internet.**

**Official TypeScript SDK for the WAVE API — 45 API module subpaths covering streaming, production, device management, analytics, content, and monetization behind a single `Wave` client. Most modules are SDK-side TypeScript surface only; see capability statuses for what has a live backend today.**

![kind](https://img.shields.io/badge/kind-library-555?style=flat-square) ![domain](https://img.shields.io/badge/domain-sdk-0a7?style=flat-square) ![lang](https://img.shields.io/badge/lang-TypeScript-3178c6?style=flat-square) ![visibility](https://img.shields.io/badge/visibility-public-brightgreen?style=flat-square)

[docs](https://docs.wave.online/sdk) · [npm](https://www.npmjs.com/package/@wave-av/sdk) · [repo](https://github.com/wave-av/sdk) · [Docs](https://docs.wave.online) · [Status](https://wave.online/status)

</div>

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

// Render a video from a typed Brief — x402-payable, no signup required.
// Reachable today via the base WaveClient (no dedicated wrapper module yet).
const render = await wave.client.post("/v1/render", {
  template: "lowerThird",
  props: { title: "Hello from WAVE" },
});

// Usage ledger by channel — mail, voice, sms, realtime, storage.
const ledger = await wave.meter.ledger({ channel: "mail" });
```

## Capabilities
- **Pricing Pages** — create/list/read tier manifests (pricing.wave.online/<slug> hosted pages; scopes pricing:write/pricing:read)

| Capability | Status |
| --- | --- |
| Auto-captions, translation, burn-in via `wave.captions` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video clips, exports, AI highlights via `wave.clips` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Monetization, subscriptions, tips, payouts via `wave.creator` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Video editing, tracks, transitions, effects via `wave.editor` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Desktop Node fleet management, health, commands via `wave.fleet` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| x402 and MPP card-rail agent payments with scope-gate and settlement-guard, shipped at the WAVE gateway; reachable from the SDK today via the base `WaveClient` request methods (no dedicated wrapper module yet) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| AI auto-directing (Autopilot), suggestions, overrides via `wave.ghost` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-region failover, replication, topology via `wave.mesh` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Telephony bridging via `wave.phone` — core features are planned, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Live stream lifecycle, protocols, recordings, viewer metrics via `wave.pipeline` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Podcast publishing/distribution via `wave.podcast` — core features are planned, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) via `wave.prism` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Analytics, BI dashboards, revenue metrics via `wave.pulse` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-camera production, scenes, transitions, graphics, audio mixing via `wave.studio` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Transcription with speaker diarization via `wave.transcribe` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent email send, reply, search, transcript email, and SMS via `wave.mail` (x402-USDC-settled sub-cent sends) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| Usage metering ledger and rollup by channel (mail/voice/sms/realtime/storage) via `wave.meter` (requires `meter:read` scope) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| Recording storage, VOD, archive policies via `wave.vault` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Text-to-speech via `wave.voice.synthesize()`; voice-clone methods exist as SDK client surface but are not backed by a live voice product yet | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent routing (route/pool) and an OpenAI-compatible proxy for LLM/agent traffic, shipped at the WAVE gateway; reachable from the SDK today via the base `WaveClient` request methods (no dedicated wrapper module yet) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |

## The receipts

| Claim | How it's verified |
| --- | --- |
| The base WaveClient exposes a generic `post()`/`get()` request method that any endpoint — including gateway/dispatch routes without a dedicated wrapper module — can be reached through | grep the client source for `class WaveClient` |
| Documentation surface is docs.wave.online | grep `package.json` |
| Licensed Apache-2.0 | grep `package.json` |
| 45 independently-importable API module subpaths are declared under package.json exports, plus the package root | grep `package.json` |
| Requires Node.js &gt;=18.0.0 | grep `package.json` |
| The npm package is published as @wave-av/sdk | grep `package.json` |
| Current package.json version is 2.1.3 | grep `package.json` |
| Each API module is independently importable via a package.json subpath export (e.g. @wave-av/sdk/pipeline) | grep `package.json` |
| `wave.voice.synthesize()` implements text-to-speech; the SDK also declares `cloneVoice()` client methods that are not backed by a live voice product | grep the voice module source |
| A single `Wave` client class composes every API module as a readonly property | grep the SDK entry point |
| Takes zod `^3.22.0 \|\| ^4.4.3` and `@opentelemetry/api ^1.7.0` as peer dependencies | grep `package.json` |

## Topics

`sdk` · `typescript` · `streaming` · `video` · `audio` · `production` · `webrtc` · `ndi` · `srt` · `clips` · `voice` · `transcription` · `captions` · `analytics`

---

<div align="center">

**Built by [WAVE Online, LLC](https://wave.online)** · [wave.online](https://wave.online) · [Docs](https://docs.wave.online) · [LinkedIn](https://www.linkedin.com/company/wave-online)

</div>


## The `wave` CLI

The SDK ships a CLI. Install globally and script WAVE from your terminal or agent:

```bash
npm install -g @wave-av/sdk
wave --help
```

The CLI is a thin arg parser over the same `RuntimeClient` the SDK exports, so every
command maps 1:1 to the API surface. Agents can call it without building integrations.
