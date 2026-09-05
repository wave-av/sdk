<div align="center">

# sdk

**WAVE is media infrastructure for the agentic internet: one call shape moves live and on-demand media across every transport, and both kinds of user, people and agents, discover it, call it, and pay for it per call. This SDK is the TypeScript client for that call shape: API modules covering streaming, production, device management, analytics, content, and monetization behind a single `Wave` client. Most modules are SDK-side TypeScript surface only; see capability statuses for what has a live backend today.**

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

## API modules — Core streaming

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.pipeline` | `PipelineAPI` | lib | Live stream lifecycle, protocols, recordings, viewer metrics |
| `wave.studio` | `StudioAPI` | planned | Multi-camera production, scenes, transitions, graphics, audio mixing |

## API modules — Enterprise

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.fleet` | `FleetAPI` | planned | Desktop Node fleet management, health, commands |
| `wave.ghost` | `GhostAPI` | planned | AI auto-directing (Autopilot), suggestions, overrides |
| `wave.mesh` | `MeshAPI` | planned | Multi-region failover, replication, topology |
| `wave.edge` | `EdgeAPI` | sdk-surface | CDN, edge workers, cache, routing rules |
| `wave.pulse` | `PulseAPI` | planned | Analytics, BI dashboards, revenue metrics |
| `wave.prism` | `PrismAPI` | planned | Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) |
| `wave.zoom` | `ZoomAPI` | sdk-surface | Zoom meetings, rooms, recordings, RTMS |

## API modules — Content & commerce

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.clips` | `ClipsAPI` | lib | Video clips, exports, AI highlights |
| `wave.editor` | `EditorAPI` | lib | Video editing, tracks, transitions, effects |
| `wave.voice` | `VoiceAPI` | lib | Text-to-speech via `synthesize()`; voice-clone methods are SDK surface only |
| `wave.phone` | `PhoneAPI` | planned | Voice calling, conferences, numbers |
| `wave.collab` | `CollabAPI` | sdk-surface | Real-time collaboration rooms |
| `wave.captions` | `CaptionsAPI` | lib | Auto-captions, translation, burn-in |
| `wave.chapters` | `ChaptersAPI` | sdk-surface | Video chapters and markers |
| `wave.studioAI` | `StudioAIAPI` | sdk-surface | AI production assistant, suggestions |
| `wave.transcribe` | `TranscribeAPI` | lib | Transcription with speaker diarization |
| `wave.sentiment` | `SentimentAPI` | sdk-surface | Sentiment and emotion analysis |
| `wave.search` | `SearchAPI` | sdk-surface | Full-text, visual, and audio search |
| `wave.scene` | `SceneAPI` | sdk-surface | AI scene detection and shot classification |
| `wave.vault` | `VaultAPI` | planned | Recording storage, VOD, archive policies |
| `wave.marketplace` | `MarketplaceAPI` | sdk-surface | Templates, plugins, graphics marketplace |
| `wave.connect` | `ConnectAPI` | sdk-surface | Third-party integrations, webhooks |
| `wave.distribution` | `DistributionAPI` | sdk-surface | Social simulcasting, scheduled posts |
| `wave.desktop` | `DesktopAPI` | sdk-surface | Desktop Node app management |
| `wave.signage` | `SignageAPI` | sdk-surface | Digital signage displays, playlists |
| `wave.qr` | `QrAPI` | sdk-surface | Dynamic QR codes, analytics |
| `wave.audience` | `AudienceAPI` | sdk-surface | Polls, Q&A, reactions, engagement |
| `wave.creator` | `CreatorAPI` | planned | Monetization, subscriptions, tips, payouts |

## API modules — Specialized

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.podcast` | `PodcastAPI` | planned | Podcast episodes, RSS, distribution |
| `wave.slides` | `SlidesAPI` | sdk-surface | Presentation-to-video conversion |
| `wave.usb` | `UsbAPI` | sdk-surface | USB device relay and management |

## API modules — Platform

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.drm` | `DrmAPI` | sdk-surface | Digital Rights Management: content protection with Widevine, FairPlay, and PlayReady |
| `wave.notifications` | `NotificationsAPI` | sdk-surface | User notification preferences, delivery channels, and notification management |
| `wave.perception` | `PerceptionAPI` | sdk-surface | Agentic live-media perception: one `subscribe()` verb attaches an agent to any live stream |
| `wave.realtime` | `RealtimeAPI` | sdk-surface | Control & event plane: presence, pub/sub broadcast, and the streaming-event bus |

## What the Status column means

`lib` — the TypeScript client surface exists AND a live fleet backend serves it today. `planned` — the client surface exists, the backend does not yet; calling it will not work against production. `sdk-surface` — the client module is exported and typed, but this repo's SSOT declares no backend status for it, so treat it as unproven. Statuses come from `.wave/repo.json`, the same file this README is generated from.

## Product example — Streams (Pipeline)

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const stream = await wave.pipeline.create({
  title: "My Live Stream",
  protocol: "webrtc",
  recording_enabled: true,
});
await wave.pipeline.start(stream.id);
const live = await wave.pipeline.waitForLive(stream.id);
console.log(`Playback: ${live.playback_url}`);
await wave.pipeline.stop(stream.id);
```

## Product example — Clips

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const clip = await wave.clips.create({
  title: "Best Moment",
  source: { type: "stream", id: "stream_123", start_time: 120, end_time: 150 },
});
const ready = await wave.clips.waitForReady(clip.id);
console.log(`Clip URL: ${ready.playback_url}`);
```

## Product example — Captions

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const track = await wave.captions.generate({
  media_id: "video_123",
  media_type: "video",
  language: "en",
  speaker_diarization: true,
});
const ready = await wave.captions.waitForReady(track.id);
await wave.captions.translate(ready.id, { target_language: "es" });
```

## Product example — Voice

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const voices = await wave.voice.listVoices({ language: "en" });
const result = await wave.voice.synthesize({
  text: "Welcome to WAVE live streaming.",
  voice_id: voices.data[0].id,
  format: "mp3",
});
const audio = await wave.voice.waitForSynthesis(result.id);
console.log(`Audio: ${audio.audio_url}`);
```

## Product example — Transcription

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const job = await wave.transcribe.create({
  source_type: "recording",
  source_id: "rec_456",
  language: "en",
  speaker_diarization: true,
});
const result = await wave.transcribe.waitForReady(job.id);
const text = await wave.transcribe.getText(result.id, { include_speakers: true });
console.log(text);
```

## Product example — Editor

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const project = await wave.editor.createProject({
  name: "Highlight Reel",
  width: 1920,
  height: 1080,
  frame_rate: 30,
});
const track = await wave.editor.addTrack(project.id, { name: "Main", type: "video" });
await wave.editor.addElement(project.id, {
  track_id: track.id,
  type: "clip",
  source_id: "clip_789",
  start_time: 0,
});
const job = await wave.editor.render(project.id, { format: "mp4", quality: "high" });
const rendered = await wave.editor.waitForRender(project.id, job.id);
console.log(`Output: ${rendered.output_url}`);
```

## Configuration

```typescript
const wave = new Wave({
  apiKey: "your-api-key", // Required
  organizationId: "org_123", // Multi-tenant isolation
  baseUrl: "https://api.wave.online", // Default
  timeout: 30000, // Request timeout (ms)
  maxRetries: 3, // Retry attempts
  debug: false, // Debug logging
});
```

## Individual API imports

```typescript
import { WaveClient, PipelineAPI, PrismAPI } from "@wave-av/sdk";

const client = new WaveClient({ apiKey: "key" });
const pipeline = new PipelineAPI(client);
const prism = new PrismAPI(client);
```

## Error handling

```typescript
import { WaveError, RateLimitError } from "@wave-av/sdk";

try {
  await wave.pipeline.get("invalid-id");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof WaveError) {
    console.log(`${error.code}: ${error.message} (${error.statusCode})`);
  }
}
```

## Events

```typescript
wave.client.on("request.start", (url, method) => {
  console.log(`${method} ${url}`);
});

wave.client.on("rate_limit.hit", (retryAfter) => {
  console.log(`Rate limited. Waiting ${retryAfter}ms`);
});
```

## Troubleshooting — Types not resolving from subpath imports

Ensure your `tsconfig.json` uses `"moduleResolution": "node16"` or `"nodenext"`:

## Troubleshooting — Types not resolving from subpath imports (fix)

```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16"
  }
}
```

## Troubleshooting — Rate limit errors

The SDK retries automatically with exponential backoff. To handle rate limits explicitly:

## Troubleshooting — Rate limit errors (example)

```typescript
wave.client.on("rate_limit.hit", (retryAfter) => {
  console.log(`Rate limited. Retry in ${retryAfter}ms`);
});
```

## Troubleshooting — ESM vs CJS

The SDK supports both ESM and CJS. If using CommonJS, ensure you're importing correctly:

## Troubleshooting — ESM vs CJS (example)

```javascript
const { Wave } = require("@wave-av/sdk");
```

## Requirements

- Node.js 18+ (`engines.node` is `&gt;=18.0.0`)
- TypeScript 4.7+ for subpath type resolution (`moduleResolution: node16`); this package is built with TypeScript 5.9

## Related packages

| Package | Description |
| --- | --- |
| [@wave-av/adk](https://www.npmjs.com/package/@wave-av/adk) | Agent Developer Kit for building AI video agents |
| [@wave-av/mcp-server](https://www.npmjs.com/package/@wave-av/mcp-server) | MCP server for Claude, Cursor, Windsurf |
| [@wave-av/cli](https://www.npmjs.com/package/@wave-av/cli) | Command-line interface |
| [@wave-av/create-app](https://www.npmjs.com/package/@wave-av/create-app) | Scaffold a new project |
| [@wave-av/workflow-sdk](https://www.npmjs.com/package/@wave-av/workflow-sdk) | Workflow orchestration |
| [OpenAPI spec](https://github.com/wave-av/api-spec) | Full API specification |

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
