# @wave-av/sdk — WAVE SDK for TypeScript

[![npm version](https://img.shields.io/npm/v/@wave-av/sdk.svg)](https://www.npmjs.com/package/@wave-av/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@wave-av/sdk.svg)](https://www.npmjs.com/package/@wave-av/sdk)
[![license](https://img.shields.io/npm/l/@wave-av/sdk.svg)](https://github.com/wave-av/sdk/blob/main/LICENSE)

Official TypeScript SDK for the WAVE API. 34 API modules covering streaming, production, analytics, and more.

## Installation

```bash
pnpm add @wave-av/sdk
# or
npm install @wave-av/sdk
```

## Quick start

```typescript
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

// Get analytics
const viewers = await wave.pulse.getViewerAnalytics({ time_range: "24h" });
console.log(`Peak concurrent: ${viewers.peak_concurrent}`);
```

## All 34 APIs

### P1 - Core streaming

| API             | Access        | Description                                                          |
| --------------- | ------------- | -------------------------------------------------------------------- |
| `wave.pipeline` | `PipelineAPI` | Live stream lifecycle, protocols, recordings, viewer metrics         |
| `wave.studio`   | `StudioAPI`   | Multi-camera production, scenes, transitions, graphics, audio mixing |

### P2 - Enterprise

| API          | Access     | Description                                                  |
| ------------ | ---------- | ------------------------------------------------------------ |
| `wave.fleet` | `FleetAPI` | Desktop Node fleet management, health, commands              |
| `wave.ghost` | `GhostAPI` | AI auto-directing (Autopilot), suggestions, overrides        |
| `wave.mesh`  | `MeshAPI`  | Multi-region failover, replication, topology                 |
| `wave.edge`  | `EdgeAPI`  | CDN, edge workers, cache, routing rules                      |
| `wave.pulse` | `PulseAPI` | Analytics, BI dashboards, revenue metrics                    |
| `wave.prism` | `PrismAPI` | Virtual Device Bridge (NDI/ONVIF/VISCA/Dante to USB UVC/UAC) |
| `wave.zoom`  | `ZoomAPI`  | Zoom meetings, rooms, recordings, RTMS                       |

### P3 - Content & commerce

| API                 | Access            | Description                                 |
| ------------------- | ----------------- | ------------------------------------------- |
| `wave.clips`        | `ClipsAPI`        | Video clips, exports, AI highlights         |
| `wave.editor`       | `EditorAPI`       | Video editing, tracks, transitions, effects |
| `wave.voice`        | `VoiceAPI`        | Text-to-speech, voice cloning               |
| `wave.phone`        | `PhoneAPI`        | Voice calling, conferences, numbers         |
| `wave.collab`       | `CollabAPI`       | Real-time collaboration rooms               |
| `wave.captions`     | `CaptionsAPI`     | Auto-captions, translation, burn-in         |
| `wave.chapters`     | `ChaptersAPI`     | Video chapters and markers                  |
| `wave.studioAI`     | `StudioAIAPI`     | AI production assistant, suggestions        |
| `wave.transcribe`   | `TranscribeAPI`   | Transcription with speaker diarization      |
| `wave.sentiment`    | `SentimentAPI`    | Sentiment and emotion analysis              |
| `wave.search`       | `SearchAPI`       | Full-text, visual, and audio search         |
| `wave.scene`        | `SceneAPI`        | AI scene detection and shot classification  |
| `wave.vault`        | `VaultAPI`        | Recording storage, VOD, archive policies    |
| `wave.marketplace`  | `MarketplaceAPI`  | Templates, plugins, graphics marketplace    |
| `wave.connect`      | `ConnectAPI`      | Third-party integrations, webhooks          |
| `wave.distribution` | `DistributionAPI` | Social simulcasting, scheduled posts        |
| `wave.desktop`      | `DesktopAPI`      | Desktop Node app management                 |
| `wave.signage`      | `SignageAPI`      | Digital signage displays, playlists         |
| `wave.qr`           | `QrAPI`           | Dynamic QR codes, analytics                 |
| `wave.audience`     | `AudienceAPI`     | Polls, Q&A, reactions, engagement           |
| `wave.creator`      | `CreatorAPI`      | Monetization, subscriptions, tips, payouts  |

### P4 - Specialized

| API            | Access       | Description                         |
| -------------- | ------------ | ----------------------------------- |
| `wave.podcast` | `PodcastAPI` | Podcast episodes, RSS, distribution |
| `wave.slides`  | `SlidesAPI`  | Presentation-to-video conversion    |
| `wave.usb`     | `UsbAPI`     | USB device relay and management     |

## Product examples

- [Streams (Pipeline)](#streams-pipeline)
- [Clips](#clips)
- [Captions](#captions)
- [Chapters](#chapters)
- [Voice](#voice)
- [Transcription](#transcription)
- [Editor](#editor)
- [Phone](#phone)
- [Podcast](#podcast)
- [Collab](#collab)
- [Analytics (Pulse)](#analytics-pulse)
- [VOD (Vault)](#vod-vault)
- [Studio AI](#studio-ai)

---

### Streams (Pipeline)

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

### Clips

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

### Captions

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

### Chapters

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

### Voice

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

### Transcription

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

### Editor

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

### Phone

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

### Podcast

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

### Collab

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

### Analytics (Pulse)

```typescript
import { Wave } from "@wave-av/sdk";

const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });

const viewers = await wave.pulse.getViewerAnalytics({ time_range: "24h" });
console.log(`Peak concurrent: ${viewers.peak_concurrent}`);
console.log(`Unique viewers: ${viewers.unique_viewers}`);

const stream = await wave.pulse.getStreamAnalytics("stream_123", { time_range: "7d" });
console.log(`Quality score: ${stream.quality_score}`);
```

### VOD (Vault)

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

### Studio AI

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

---

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

## Troubleshooting

### Types not resolving from subpath imports

Ensure your `tsconfig.json` uses `"moduleResolution": "node16"` or `"nodenext"`:

```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16"
  }
}
```

### Rate limit errors

The SDK retries automatically with exponential backoff. To handle rate limits explicitly:

```typescript
wave.client.on("rate_limit.hit", (retryAfter) => {
  console.log(`Rate limited. Retry in ${retryAfter}ms`);
});
```

### ESM vs CJS

The SDK supports both ESM and CJS. If using CommonJS, ensure you're importing correctly:

```javascript
const { Wave } = require("@wave-av/sdk");
```

## Requirements

- Node.js 18+
- TypeScript 5.0+ (recommended 5.5+ for best subpath support)

## Related packages

- [@wave-av/adk](https://www.npmjs.com/package/@wave-av/adk) — Agent Developer Kit for building AI video agents
- [@wave-av/mcp-server](https://www.npmjs.com/package/@wave-av/mcp-server) — MCP server for Claude, Cursor, Windsurf
- [@wave-av/cli](https://www.npmjs.com/package/@wave-av/cli) — Command-line interface
- [@wave-av/create-app](https://www.npmjs.com/package/@wave-av/create-app) — Scaffold a new project
- [@wave-av/workflow-sdk](https://www.npmjs.com/package/@wave-av/workflow-sdk) — Workflow orchestration
- [OpenAPI spec](https://github.com/wave-av/api-spec) — Full API specification

## License

MIT - WAVE Online, LLC