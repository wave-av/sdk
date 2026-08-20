import { WaveClient } from './client.js';
import 'eventemitter3';
import './telemetry.js';
import './client-types.js';

/**
 * WAVE SDK - Perception API
 *
 * Agentic live-media perception: the uniform `subscribe()` verb (#85, gateway ADR-0004). ONE call attaches an
 * agent to ANY live stream — a WHEP playback URL, an `srt://` URI, or a Cloudflare Stream live-input uid — and
 * returns the normalized RECEIVE DESCRIPTOR a WHEP/SRT receiver (the "agent as receive-endpoint") uses to
 * attach, decode, sample frames, and hand them to gateway-native inference at `/v1/messages`.
 *
 * ONE RAIL, METERED SERVER-SIDE: the gateway is the sole meter emitter. `subscribe()` consumes nothing itself —
 * it NAMES (never guesses) the existing meters the session will bill on: the transport's delivered-minutes
 * meter for delivery, and the per-tier `wave_ai_tokens_*` meters for inference. Auth, scope (`perception:write`),
 * entitlement, rate limit, and metering are all enforced by the gateway; the SDK only forwards your API key.
 *
 * The perception control plane is INERT until the operator arms it (`WAVE_PERCEPTION_ENABLED=1`); until then
 * every route fail-closes 503 (`PERCEPTION_UNCONFIGURED`).
 */

/** Transports the gateway resolves a stream reference to. The caller never branches on transport — the
 *  gateway owns resolution and returns exactly one populated url on the {@link ReceiveDescriptor}. */
type PerceptionTransport = "whep" | "srt";
/** D1 sampling cadence. Floor: ≥1 sample / 2 s (`minIntervalMs ≤ 2000`). Ceiling: `maxFps ≤ 2`. */
type PerceptionSampleMode = "adaptive" | "fixed" | "keyframe";
interface PerceptionSample {
    /** `adaptive` (default) samples on motion/keyframes; `fixed` at `maxFps`; `keyframe` on GOP boundaries. */
    mode?: PerceptionSampleMode;
    /** Frames/sec ceiling for sampling, in (0, 2]. Default 2. Over-ceiling is a hard 400 (never silently clamped). */
    maxFps?: number;
    /** Min ms between samples, in [0, 2000] (the 2-second liveness floor). Default 2000. */
    minIntervalMs?: number;
}
/** D2 audio path. `transcribe` (default) runs speech→text; `raw` opts into PCM; `off` disables audio. */
type PerceptionAudioMode = "transcribe" | "raw" | "off";
/** D3 frame→model handoff. JPEG only in v1; `maxEdge` long-edge px in [64, 2048] (default 1280; 2048 for OCR). */
interface PerceptionFrame {
    encoding?: "jpeg";
    maxEdge?: number;
}
/** D3 micro-batch of frames per inference call. `maxFrames` in [1, 16] (default 4); `maxDelayMs` ≥ 0 (default 250). */
interface PerceptionBatch {
    maxFrames?: number;
    maxDelayMs?: number;
}
/** Body for {@link PerceptionAPI.subscribe}. Only `stream` is required; every other field defaults server-side. */
interface SubscribeRequest {
    /** A WHEP playback URL, an `srt://…` URI, a Cloudflare Stream `…/webRTC/play` URL, or a 32-hex CF live-input uid. */
    stream: string;
    /** Natural-language task/intent for the agent (e.g. "flag when a goal is scored"). ≤8192 chars. */
    task?: string;
    sample?: PerceptionSample;
    /** Audio mode. Accepts the bare string form the gateway expects (e.g. `"transcribe"`). */
    audio?: PerceptionAudioMode;
    frame?: PerceptionFrame;
    batch?: PerceptionBatch;
    /** Vision model id. Default `claude-haiku` (fast vision tier). Determines the `wave_ai_tokens_<tier>_*` meters. */
    model?: string;
}
/** The receive descriptor the agent's WHEP/SRT receiver attaches to. Exactly one url is non-null per transport. */
interface ReceiveDescriptor {
    whep_url: string | null;
    srt_url: string | null;
}
/** The EXISTING gateway meters this subscription bills on (D7 — no new SKU; gateway is the sole emitter). */
interface PerceptionMeterBinding {
    /** Transport delivered-minutes meter (`wave_whep_egress_minutes` or `wave_stream_delivered_minutes`). */
    delivery: string;
    /** Per-tier inference token meters (`wave_ai_tokens_<tier>_input` / `_output`). */
    aiTokensIn: string;
    aiTokensOut: string;
}
/** Normalized, defaults-applied echo of the accepted subscribe options (mirrors the server contract). */
interface PerceptionOptions {
    sample: {
        mode: PerceptionSampleMode;
        maxFps: number;
        minIntervalMs: number;
    };
    audio: {
        mode: PerceptionAudioMode;
    };
    frame: {
        encoding: "jpeg";
        maxEdge: number;
    };
    batch: {
        maxFrames: number;
        maxDelayMs: number;
    };
    model: string;
}
/** 201 response from `POST /v1/perception/subscribe`. */
interface PerceptionSubscription extends PerceptionOptions {
    ok: true;
    /** `psub_`-prefixed correlation key across delivery + inference for this session (pass to {@link PerceptionAPI.unsubscribe}). */
    subscription_id: string;
    /** Gateway-validated principal org (attribution + meter-window owner). */
    org: string;
    transport: PerceptionTransport;
    receive: ReceiveDescriptor;
    task: string | null;
    /** Gateway-native inference endpoint each micro-batched sample is posted to (`/v1/messages`). */
    inference_endpoint: string;
    meters: PerceptionMeterBinding;
}
/**
 * Agentic live-media perception — subscribe an agent to any live stream and let it perceive + reason over the
 * frames, metered on one rail by the gateway.
 *
 * @example
 * ```typescript
 * const sub = await wave.perception.subscribe({
 *   stream: "srt://ingest.example.com:9000?streamid=game",
 *   task: "Describe notable on-field events as they happen.",
 *   sample: { mode: "adaptive", maxFps: 2 },
 *   model: "claude-haiku",
 * });
 * // The agent's receiver attaches to sub.receive.whep_url ?? sub.receive.srt_url,
 * // samples frames, and POSTs each batch to sub.inference_endpoint.
 * // ...
 * await wave.perception.unsubscribe(sub.subscription_id);
 * ```
 */
declare class PerceptionAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /** Open a perception session over any transport. Returns the receive descriptor + subscription id + meter binding. */
    subscribe(request: SubscribeRequest): Promise<PerceptionSubscription>;
    /** Close a subscription (idempotent control-plane close ack). `id` is the `psub_…` from {@link subscribe}. */
    unsubscribe(subscriptionId: string): Promise<void>;
    /** The single populated receive URL for a subscription, regardless of transport (convenience for receivers). */
    static receiveUrl(sub: PerceptionSubscription): string | null;
}
declare function createPerceptionAPI(client: WaveClient): PerceptionAPI;

export { PerceptionAPI, type PerceptionAudioMode, type PerceptionBatch, type PerceptionFrame, type PerceptionMeterBinding, type PerceptionOptions, type PerceptionSample, type PerceptionSampleMode, type PerceptionSubscription, type PerceptionTransport, type ReceiveDescriptor, type SubscribeRequest, createPerceptionAPI };
