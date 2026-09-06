#!/usr/bin/env node
/**
 * Fresh-install / CI regression smoke: runs the README quickstart verbatim against the live
 * WAVE gateway (api.wave.online). Exercises `wave.pipeline.create` and `wave.voice.synthesize`
 * exactly as documented so an ESM/CJS/module-resolution regression in a fresh install surfaces
 * here before it reaches a consumer.
 *
 * Exit code contract (see .github/workflows/smoke-install.yml):
 *   0   the SDK produced a well-formed HTTP response of ANY status code (200, 402, 403, 404,
 *       ...) — that proves import/build/transport worked: request was constructed, sent over
 *       HTTPS, and a structured response came back. Route availability / auth-scope gating is
 *       a product concern, not an install/import regression, so any parsed status counts.
 *       Also exits 0 when WAVE_GATEWAY_API_KEY/WAVE_API_KEY is absent (nothing to run).
 *   1   a module/transport-class failure: the SDK threw before completing an HTTP round trip
 *       (import error, "is not a function", ESM/CJS ReferenceError, DNS/connect failure with
 *       no response) — no parsed HTTP status was ever obtained.
 */
import { Wave } from "@wave-av/sdk";

const apiKey = process.env.WAVE_API_KEY ?? process.env.WAVE_GATEWAY_API_KEY;

if (!apiKey) {
  console.log("skipped: no API key in env (WAVE_API_KEY / WAVE_GATEWAY_API_KEY)");
  process.exit(0);
}

const wave = new Wave({
  apiKey,
  organizationId: "org_123",
});

async function tryCall(label, fn) {
  try {
    const result = await fn();
    console.log(`${label}: ok`, JSON.stringify(result).slice(0, 200));
    return { label, ok: true };
  } catch (err) {
    const status = err && typeof err === "object" ? err.status ?? err.statusCode : undefined;
    const code = err && typeof err === "object" ? err.code : undefined;
    const message = err instanceof Error ? err.message : String(err);
    console.log(`${label}: status=${status ?? "n/a"} code=${code ?? "n/a"} message=${message}`);
    return { label, ok: false, status, code, message };
  }
}

const results = [];

// Create and start a live stream (README quickstart, verbatim shape).
results.push(
  await tryCall("pipeline.create", () =>
    wave.pipeline.create({
      title: "My Live Stream",
      protocol: "webrtc",
      recording_enabled: true,
    }),
  ),
);

// Text-to-speech (README quickstart, verbatim shape).
results.push(
  await tryCall("voice.synthesize", () =>
    wave.voice.synthesize({
      text: "Hello from WAVE",
      voice_id: "voice_abc",
    }),
  ),
);

let sawReachedGateway = false;
let sawModuleOrTransportError = false;

for (const r of results) {
  // ok:true (2xx, parsed body) or ok:false with a defined numeric status/known gateway error
  // code both mean a real HTTP round trip completed — that is what this smoke proves.
  if (r.ok || typeof r.status === "number" || r.code === "SCOPE_INSUFFICIENT") {
    sawReachedGateway = true;
    continue;
  }
  // No HTTP status at all means the request never completed a round trip: the SDK itself
  // threw before/instead of making the call (import/module/type-error class), or the network
  // layer failed with no response (DNS, connection refused, etc).
  sawModuleOrTransportError = true;
}

if (!sawReachedGateway || sawModuleOrTransportError) {
  console.error(
    sawModuleOrTransportError
      ? "FAIL: at least one call never completed an HTTP round trip (module/transport-class failure)"
      : "FAIL: no call completed an HTTP round trip",
  );
  process.exit(1);
}

console.log("PASS: every call completed an HTTP round trip against the gateway");
process.exit(0);
