<div align="center">

# sdk

**WAVE is media infrastructure for the agentic internet: one call shape moves live and on-demand media across every transport, and both kinds of user, people and agents, discover it, call it, and pay for it per call. This SDK is the TypeScript client for that call shape: API modules covering streaming, production, device management, analytics, content, and monetization behind a single `Wave` client. Most modules are SDK-side TypeScript surface only; see capability statuses for what has a live backend today.**

![kind](https://img.shields.io/badge/kind-library-555?style=flat-square) ![domain](https://img.shields.io/badge/domain-sdk-0a7?style=flat-square) ![lang](https://img.shields.io/badge/lang-TypeScript-3178c6?style=flat-square) ![visibility](https://img.shields.io/badge/visibility-public-brightgreen?style=flat-square)

[npm](https://www.npmjs.com/package/@wave-av/sdk) · [repo](https://github.com/wave-av/sdk) · [Docs](https://docs.wave.online) · [Status](https://wave.online/status)

</div>

---

## Quick start

```bash
npm install @wave-av/sdk
```

```ts
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

// OpenAI-compatible inference through the WAVE gateway, on your WAVE API key.
const models = await wave.inference.models();
const reply = await wave.inference.complete(
  models[0].id,
  [{ role: "user", content: "Say hello in five words." }],
  64,
);
console.log(`${reply.model}: ${reply.content}`);

// Today's usage ledger by channel (mail, voice, sms, realtime, storage). Requires meter:read.
const ledger = await wave.meter.ledger();
console.log(`${ledger.channels.voice?.minutes ?? 0} voice minutes today`);

// Recent events on a realtime channel, over REST. Requires realtime:read.
const { events } = await wave.realtime.history("stream:demo", 10);
console.log(`${events.length} recent events`);
```

Every call in this block goes to a route the gateway serves today. A call to a module whose
backend has not shipped yet (see the Status column below) throws `RouteNotServedError`, a
`WaveError` subclass, so "not built yet" is easy to tell apart from a real failure.

## API modules — Core streaming

| API | Access | Status | Description |
| --- | --- | --- | --- |
| `wave.pipeline` | `PipelineAPI` | planned | Live stream lifecycle, protocols, recordings, viewer metrics |
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
| `wave.editor` | `EditorAPI` | planned | Video editing, tracks, transitions, effects |
| `wave.voice` | `VoiceAPI` | lib | Text-to-speech via `synthesize()`; voice-clone methods are SDK surface only |
| `wave.phone` | `PhoneAPI` | planned | Voice calling, conferences, numbers |
| `wave.collab` | `CollabAPI` | planned | Real-time collaboration rooms |
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
| `wave.realtime` | `RealtimeAPI` | lib | Control & event plane: presence, pub/sub broadcast, and the streaming-event bus, at `api.wave.online/v1/realtime` |
| `wave.inference` | `InferenceAPI` | lib | OpenAI-compatible completions and the model list, at `api.wave.online/v1/inference` |
| `wave.meter` | `MeterAPI` | lib | Usage ledger and rollup by channel (mail, voice, sms, realtime, storage) |
| `wave.mail` | `MailAPI` | planned | Agent email send, reply, search, transcript email, and SMS |

## What the Status column means

`lib` — the TypeScript client surface exists AND a live fleet backend serves it today. `planned` — the client surface exists, the backend does not yet; calling it will not work against production, and the gateway's `404 ROUTE_NOT_FOUND` / `ROUTE_NOT_MAPPED` answer reaches you as a `RouteNotServedError`. `sdk-surface` — the client module is exported and typed, but this repo's SSOT declares no backend status for it, so treat it as unproven. Statuses come from `.wave/repo.json`, the same file this README is generated from. The gateway's free capability index, `https://gateway.wave.online/.well-known/wave-skills.json`, lists the routes it advertises; it can list a route before that route is served, so treat a live call as the test.

## Product example — Realtime

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

// REST, no socket needed: publish (realtime:write), presence and history (realtime:read).
await wave.realtime.publish("stream:demo", "note", { text: "hello" });
const { members } = await wave.realtime.presence("stream:demo");

// Live events over a WebSocket at wss://api.wave.online/v1/realtime/connect. The key travels in
// the Authorization header of the handshake, never in the URL. Node 22+ and Bun send that header
// natively, so this runs as-is there. On Node 18-21, `npm i ws` and pass a factory:
//   import WS from "ws";
//   wave.realtime.connect("stream:demo", {
//     webSocketFactory: (url, headers) => new WS(url, { headers }) as unknown as WebSocket,
//   });
const channel = wave.realtime.connect("stream:demo");
channel.on("caption.cue", (data) => console.log("cue", data));
channel.on("error", (err) => console.error(err));
```

Channel names are 1-128 characters of `a-z`, `0-9`, `:`, `_` and `-`, starting with a letter or
digit (`stream:abc`). Browsers cannot set WebSocket headers, so open the socket from a server.

## Product example — Clips

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

// source is a recording id; in and out are time offsets into it.
const clip = await wave.clips.create({
  title: "Best Moment",
  source: "rec_123",
  in: "2m",
  out: "2m30s",
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
import { writeFile } from "node:fs/promises";
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

// POST /v1/voice answers with the audio itself (audio/mpeg), not a job to poll.
// Omit voice_id for the default voice.
const audio = await wave.voice.synthesize({ text: "Welcome to WAVE live streaming." });
await writeFile("welcome.mp3", new Uint8Array(audio));
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

## Product example — Inference

```typescript
import { Wave, PaymentRequiredError } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

// GET /v1/inference/models and POST /v1/inference/chat/completions on the gateway. Auth, budgets,
// guardrails and metering are the gateway's; failures arrive as typed WaveErrors.
const models = await wave.inference.models(); // [{ id, ownedBy }]
try {
  const r = await wave.inference.complete(models[0].id, [{ role: "user", content: "One word: ok" }], 16);
  console.log(r.content, r.totalTokens, r.cost);
} catch (err) {
  if (err instanceof PaymentRequiredError) console.error(`${err.code}: ${err.message}`);
  else throw err;
}
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
import { WaveClient, MeterAPI, InferenceAPI } from "@wave-av/sdk";

const client = new WaveClient({ apiKey: "key" });
const meter = new MeterAPI(client);
const inference = new InferenceAPI(client);
```

Every module is also a subpath, e.g. `import { InferenceAPI } from "@wave-av/sdk/inference"`.

## Error handling

The gateway answers errors in three envelopes (nested `{ error: { code, message } }`, flat
`{ error, code, message }` from the spend cap, and the x402 `{ x402Version, accepts }` challenge).
The SDK reads all three into one `WaveError` with the gateway's `code`, and picks a subclass:

```typescript
import { WaveError, RateLimitError, PaymentRequiredError, RouteNotServedError } from "@wave-av/sdk";

try {
  await wave.meter.ledger();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof PaymentRequiredError) {
    // 402: SPEND_CAP_TIER_BLOCKED (message says what to do) or an x402 price (error.accepts).
    console.log(`${error.code}: ${error.message}`, error.accepts ?? "");
  } else if (error instanceof RouteNotServedError) {
    // 404 ROUTE_NOT_FOUND / ROUTE_NOT_MAPPED: this module's backend has not shipped.
    console.log(`${error.code}: ${error.message}`);
  } else if (error instanceof WaveError) {
    // e.g. 403 SCOPE_INSUFFICIENT: error.details.required_scope names the scope to add.
    console.log(`${error.code}: ${error.message} (${error.statusCode})`, error.details);
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

- Node.js 18+ (`engines.node` is `&gt;=18.0.0`); `wave.realtime.connect()` needs Node 22+ or Bun for a header-carrying WebSocket, or a `webSocketFactory` (e.g. the `ws` package) on older runtimes
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
- **Composer** — `import { compose, saveFlow } from "@wave-av/sdk/compose"`: `compose(intent, { budgetUsd?, flowId? })` calls `POST /v1/compose` on `api.wave.online` and returns a typed proposal (stages, scopes, price rows, call shape) — a plan the SDK never executes (`executes` is always `false`). `saveFlow(proposal, { consoleToken? })` posts to the console flows door; without a `consoleToken` it throws `ConsoleAuthRequiredError` carrying the exact `curl` a signed-in human can run instead, never a silent no-op (the console's machine-auth token has not shipped yet).
- **Pricing Pages** — create/list/read tier manifests (pricing.wave.online/<slug> hosted pages; scopes pricing:write/pricing:read)

| Capability | Status |
| --- | --- |
| Auto-captions, translation, burn-in via `wave.captions` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video clips, exports, AI highlights via `wave.clips` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Monetization, subscriptions, tips, payouts via `wave.creator` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Video editing, tracks, transitions, effects via `wave.editor` (SDK TypeScript surface; the gateway serves no `/v1/editor` route yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Desktop Node fleet management, health, commands via `wave.fleet` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| x402 and MPP card-rail agent payments with scope-gate and settlement-guard, shipped at the WAVE gateway; reachable from the SDK today via the base `WaveClient` request methods (no dedicated wrapper module yet) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| AI auto-directing (Autopilot), suggestions, overrides via `wave.ghost` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-region failover, replication, topology via `wave.mesh` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Telephony bridging via `wave.phone` — core features are planned, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Live stream lifecycle, protocols, recordings, viewer metrics via `wave.pipeline` (SDK TypeScript surface; the gateway serves no `/v1/streams` route yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Podcast publishing/distribution via `wave.podcast` — core features are planned, not yet shipped | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) via `wave.prism` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Analytics, BI dashboards, revenue metrics via `wave.pulse` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Multi-camera production, scenes, transitions, graphics, audio mixing via `wave.studio` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Transcription with speaker diarization via `wave.transcribe` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent email send, reply, search, transcript email, and SMS via `wave.mail` (SDK TypeScript surface; the gateway has no route for `/v1/mail/*`, `/v1/sms/send` or `/v1/transcripts/email` yet and answers `404 ROUTE_NOT_MAPPED`) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Realtime presence, publish, history and the WebSocket event bus via `wave.realtime`, at `api.wave.online/v1/realtime` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Usage metering ledger and rollup by channel (mail/voice/sms/realtime/storage) via `wave.meter` (requires `meter:read` scope) | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |
| Recording storage, VOD, archive policies via `wave.vault` (SDK TypeScript surface; no live backend yet) | ![planned](https://img.shields.io/badge/planned-lightgrey?style=flat-square) |
| Text-to-speech via `wave.voice.synthesize()`; voice-clone methods exist as SDK client surface but are not backed by a live voice product yet | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Agent routing (route/pool) and an OpenAI-compatible proxy for LLM/agent traffic, shipped at the WAVE gateway; completions and the model list via `wave.inference` and the `wave-sdk` CLI, the rest via the base `WaveClient` request methods | ![ga](https://img.shields.io/badge/ga-brightgreen?style=flat-square) |

## The receipts

| Claim | How it's verified |
| --- | --- |
| The base WaveClient exposes a generic `post()`/`get()` request method that any endpoint — including gateway/dispatch routes without a dedicated wrapper module — can be reached through | grep the client source for `class WaveClient` |
| The package homepage is this README (github.com/wave-av/sdk#readme); product docs are at docs.wave.online | grep `package.json` |
| Licensed Apache-2.0 | grep `package.json` |
| 49 independently-importable API module subpaths are declared under package.json exports, plus the package root | grep `package.json` |
| Requires Node.js &gt;=18.0.0 | grep `package.json` |
| The npm package is published as @wave-av/sdk | grep `package.json` |
| Current package.json version is 3.0.0, and the User-Agent header carries it (`wave-sdk-typescript/3.0.0`) | grep `package.json`, `src/version.ts` |
| Each API module is independently importable via a package.json subpath export (e.g. @wave-av/sdk/pipeline) | grep `package.json` |
| `compose()`/`saveFlow()` are independently importable via `@wave-av/sdk/compose`, and their types are generated from `src/compose-types.ts` (copied verbatim from the gateway's `POST /v1/compose` contract) into `schema/compose.schema.json` via `npm run schema:generate` | grep `package.json` exports, `schema/compose.schema.json` |
| `wave.voice.synthesize()` implements text-to-speech against `POST /v1/voice` and returns the audio bytes; the SDK also declares `cloneVoice()` client methods that are not backed by a live voice product | grep the voice module source |
| A single `Wave` client class composes every API module as a readonly property | grep the SDK entry point |
| Takes zod `^3.22.0 \|\| ^4.4.3` and `@opentelemetry/api ^1.7.0` as peer dependencies | grep `package.json` |

## Topics

`sdk` · `typescript` · `streaming` · `video` · `audio` · `production` · `webrtc` · `ndi` · `srt` · `clips` · `voice` · `transcription` · `captions` · `analytics`

---

<div align="center">

**Built by [WAVE Online, LLC](https://wave.online)** · [wave.online](https://wave.online) · [Docs](https://docs.wave.online) · [LinkedIn](https://www.linkedin.com/company/wave-online)

</div>


## The `wave-sdk` CLI

The SDK ships a CLI named `wave-sdk` (the `wave` command belongs to
[@wave-av/cli](https://www.npmjs.com/package/@wave-av/cli)). Install globally and script WAVE
from your terminal or agent:

```bash
npm install -g @wave-av/sdk
export WAVE_API_KEY=...            # required by models, complete, stream, transcripts
wave-sdk --help
wave-sdk models                    # GET  https://api.wave.online/v1/inference/models
wave-sdk complete --model qwen2.5:3b "Say hello in five words"
```

| Variable | Default | Used by |
| --- | --- | --- |
| `WAVE_API_KEY` | none | every command that calls WAVE; sent as `Authorization: Bearer` |
| `WAVE_MODEL` | first model `models` lists | `complete`, `stream` when `--model` is absent |
| `WAVE_RUNTIME_URL` | `https://api.wave.online/v1/inference` | `models`, `complete`, `stream` |
| `WAVE_BASE_URL` | `https://api.wave.online` | `transcripts` |

The CLI is a thin arg parser over the same `RuntimeClient` the SDK exports, so every
command maps 1:1 to the API surface. A failed call prints one line to stderr and exits 1;
the API key is redacted from anything it prints.
