<div align="center">

# sdk

**Official TypeScript SDK for the WAVE API — 34 API modules covering streaming, production, device management, analytics, content, and monetization behind a single `Wave` client.**

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

// Create a virtual camera from NDI
const device = await wave.prism.createDevice({
  name: "PTZ Camera 1",
  type: "camera",
  source_protocol: "ndi",
  source_endpoint: "NDI-CAM-1",
  node_id: "node_abc",
  ptz_enabled: true,
});
```

## All 34 APIs — P1 Core streaming

| API | Access | Description |
| --- | --- | --- |
| `wave.pipeline` | `PipelineAPI` | Live stream lifecycle, protocols, recordings, viewer metrics |
| `wave.studio` | `StudioAPI` | Multi-camera production, scenes, transitions, graphics, audio mixing |

## All 34 APIs — P2 Enterprise

| API | Access | Description |
| --- | --- | --- |
| `wave.fleet` | `FleetAPI` | Desktop Node fleet management, health, commands |
| `wave.ghost` | `GhostAPI` | AI auto-directing (Autopilot), suggestions, overrides |
| `wave.mesh` | `MeshAPI` | Multi-region failover, replication, topology |
| `wave.edge` | `EdgeAPI` | CDN, edge workers, cache, routing rules |
| `wave.pulse` | `PulseAPI` | Analytics, BI dashboards, revenue metrics |
| `wave.prism` | `PrismAPI` | Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) |
| `wave.zoom` | `ZoomAPI` | Zoom meetings, rooms, recordings, RTMS |

## All 34 APIs — P3 Content & commerce

| API | Access | Description |
| --- | --- | --- |
| `wave.clips` | `ClipsAPI` | Video clips, exports, AI highlights |
| `wave.editor` | `EditorAPI` | Video editing, tracks, transitions, effects |
| `wave.voice` | `VoiceAPI` | Text-to-speech, voice cloning |
| `wave.phone` | `PhoneAPI` | Voice calling, conferences, numbers |
| `wave.collab` | `CollabAPI` | Real-time collaboration rooms |
| `wave.captions` | `CaptionsAPI` | Auto-captions, translation, burn-in |
| `wave.chapters` | `ChaptersAPI` | Video chapters and markers |
| `wave.studioAI` | `StudioAIAPI` | AI production assistant, suggestions |
| `wave.transcribe` | `TranscribeAPI` | Transcription with speaker diarization |
| `wave.sentiment` | `SentimentAPI` | Sentiment and emotion analysis |
| `wave.search` | `SearchAPI` | Full-text, visual, and audio search |
| `wave.scene` | `SceneAPI` | AI scene detection and shot classification |
| `wave.vault` | `VaultAPI` | Recording storage, VOD, archive policies |
| `wave.marketplace` | `MarketplaceAPI` | Templates, plugins, graphics marketplace |
| `wave.connect` | `ConnectAPI` | Third-party integrations, webhooks |
| `wave.distribution` | `DistributionAPI` | Social simulcasting, scheduled posts |
| `wave.desktop` | `DesktopAPI` | Desktop Node app management |
| `wave.signage` | `SignageAPI` | Digital signage displays, playlists |
| `wave.qr` | `QrAPI` | Dynamic QR codes, analytics |
| `wave.audience` | `AudienceAPI` | Polls, Q&A, reactions, engagement |
| `wave.creator` | `CreatorAPI` | Monetization, subscriptions, tips, payouts |

## All 34 APIs — P4 Specialized

| API | Access | Description |
| --- | --- | --- |
| `wave.podcast` | `PodcastAPI` | Podcast episodes, RSS, distribution |
| `wave.slides` | `SlidesAPI` | Presentation-to-video conversion |
| `wave.usb` | `UsbAPI` | USB device relay and management |

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

## Product example — Chapters

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const chapterSet = await wave.chapters.generate({
  media_id: "video_123",
  media_type: "video",
  method: "combined",
  generate_thumbnails: true,
});
const ready = await wave.chapters.waitForReady(chapterSet.id);
console.log(`Found ${ready.chapter_count} chapters`);
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

## Product example — Phone

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const call = await wave.phone.makeCall({
  from: "+15551234567",
  to: "+15559876543",
  timeout: 30,
});
console.log(`Call ${call.id} status: ${call.status}`);
```

## Product example — Podcast

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const show = await wave.podcast.create({
  title: "The WAVE Podcast",
  description: "Weekly streaming industry news",
  category: "Technology",
});
const episode = await wave.podcast.createEpisode({
  podcast_id: show.id,
  title: "Episode 1: Getting Started",
  description: "An introduction to live streaming.",
});
await wave.podcast.publishEpisode(episode.id);
```

## Product example — Collab

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const room = await wave.collab.createRoom({
  name: "Project Review",
  resource_type: "project",
  resource_id: "proj_123",
  settings: { voice_enabled: true, annotations_enabled: true },
});
console.log(`Room: ${room.id} (${room.participant_count} participants)`);
```

## Product example — Analytics (Pulse)

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const viewers = await wave.pulse.getViewerAnalytics({ time_range: "24h" });
console.log(`Peak concurrent: ${viewers.peak_concurrent}`);
console.log(`Unique viewers: ${viewers.unique_viewers}`);

const stream = await wave.pulse.getStreamAnalytics("stream_123", { time_range: "7d" });
console.log(`Quality score: ${stream.quality_score}`);
```

## Product example — VOD (Vault)

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const upload = await wave.vault.createUpload({
  title: "Conference Keynote",
  format: "mp4",
  file_size_bytes: 524288000,
});
console.log(`Upload to: ${upload.upload_url}`);

const usage = await wave.vault.getStorageUsage();
console.log(`Storage: ${usage.usage_percent}% used`);
```

## Product example — Studio AI

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const assistant = await wave.studioAI.startAssistant({
  stream_id: "stream_123",
  mode: "auto_director",
  config: { automation_level: 75, auto_apply: false, confidence_threshold: 0.8, settings: {} },
});
const suggestions = await wave.studioAI.getSuggestion(assistant.id);
console.log(`AI suggestion: ${suggestions.title} (${suggestions.confidence * 100}% confidence)`);
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

- Node.js 18+
- TypeScript 5.0+ (recommended 5.5+ for best subpath support)

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

| Capability | Status |
| --- | --- |
| Polls, Q&A, reactions, engagement via `wave.audience` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Auto-captions, translation, burn-in via `wave.captions` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video chapters and markers via `wave.chapters` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video clips, exports, AI highlights via `wave.clips` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Real-time collaboration rooms via `wave.collab` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Third-party integrations, webhooks via `wave.connect` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Monetization, subscriptions, tips, payouts via `wave.creator` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Desktop Node app management via `wave.desktop` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Social simulcasting, scheduled posts via `wave.distribution` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| CDN, edge workers, cache, routing rules via `wave.edge` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Video editing, tracks, transitions, effects via `wave.editor` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Desktop Node fleet management, health, commands via `wave.fleet` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| AI auto-directing (Autopilot), suggestions, overrides via `wave.ghost` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Templates, plugins, graphics marketplace via `wave.marketplace` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Multi-region failover, replication, topology via `wave.mesh` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Voice calling, conferences, numbers via `wave.phone` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Live stream lifecycle, protocols, recordings, viewer metrics via `wave.pipeline` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Podcast episodes, RSS, distribution via `wave.podcast` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) via `wave.prism` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Analytics, BI dashboards, revenue metrics via `wave.pulse` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Dynamic QR codes, analytics via `wave.qr` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| AI scene detection and shot classification via `wave.scene` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Full-text, visual, and audio search via `wave.search` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Sentiment and emotion analysis via `wave.sentiment` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Digital signage displays, playlists via `wave.signage` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Presentation-to-video conversion via `wave.slides` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Multi-camera production, scenes, transitions, graphics, audio mixing via `wave.studio` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| AI production assistant, suggestions via `wave.studioAI` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Transcription with speaker diarization via `wave.transcribe` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| USB device relay and management via `wave.usb` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Recording storage, VOD, archive policies via `wave.vault` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Text-to-speech, voice cloning via `wave.voice` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |
| Zoom meetings, rooms, recordings, RTMS via `wave.zoom` | ![lib](https://img.shields.io/badge/lib-blueviolet?style=flat-square) |

## The receipts

Every claim below is checked by `npm run verify` against the live repo or endpoint — a non-`pass` verdict fails the gate.

| Claim | How it's verified |
| --- | --- |
| Documentation surface is docs.wave.online | resolved by grepping `package.json` |
| Licensed Apache-2.0 | resolved by grepping `package.json` |
| 34 API modules covering streaming, production, device management, analytics, content, and monetization | resolved by grepping `package.json` |
| Requires Node.js &gt;=18.0.0 | resolved by grepping `package.json` |
| The npm package is published as @wave-av/sdk | resolved by grepping `package.json` |
| Current package.json version is 2.1.0-next.0 | resolved by grepping `package.json` |
| Each API module is independently importable via a package.json subpath export (e.g. @wave-av/sdk/pipeline) | resolved by grepping `package.json` |
| A single `Wave` client class in src/index.ts composes every API module as a readonly property | resolved by grepping `src/index.ts` |
| Takes zod ^3.22.0 as a peer dependency for runtime validation | resolved by grepping `package.json` |

## Topics

`sdk` · `typescript` · `streaming` · `video` · `audio` · `production` · `webrtc` · `ndi` · `srt` · `clips` · `voice` · `transcription` · `captions` · `analytics`

---

<div align="center">

**Built by [WAVE Online, LLC](https://wave.online)** · [wave.online](https://wave.online) · [Docs](https://docs.wave.online) · [LinkedIn](https://www.linkedin.com/company/wave-online)

</div>

