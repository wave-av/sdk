#!/usr/bin/env node
/**
 * Strict live smoke for @wave-av/sdk against api.wave.online.
 *
 * scripts/smoke-quickstart.mjs proves transport: any HTTP status passes. This script proves the
 * documented flows are SERVED. A 402 proves a route is priced, not served, and a bare 200 proves
 * little, so every check asserts the shape of the answer, and two known-served control routes
 * must answer 200 in the same run before any other result counts.
 *
 *   node scripts/smoke-live.mjs [KEY_ENV_NAME] [--complete] [--media
 *     [--transcribe-key-env NAME] [--captions-key-env NAME]]
 *
 * KEY_ENV_NAME names the environment variable holding a WAVE API key (default WAVE_API_KEY).
 * Keys are read from the environment only and never printed; any echo of one is redacted.
 * --complete also runs one 8-token inference completion (billed, a tiny fraction of a cent).
 * --media also runs the README transcription and captions flows on a 3-second public speech
 * sample (billed, well under one cent), with the main key unless a product key env is named.
 *
 * The SDK is loaded from WAVE_SDK_ENTRY when set (e.g. "@wave-av/sdk" in a fresh install), else
 * from this checkout's dist/ (run `npm run build` first).
 *
 * Exit 0: every check passed. Exit 1: at least one failed. Exit 2: no key, or the controls
 * failed (the gateway itself is unreachable, so nothing else can be judged).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(["--transcribe-key-env", "--captions-key-env"]);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const keyName = args.find((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(args[i - 1])) ?? "WAVE_API_KEY";
const runComplete = args.includes("--complete");
const runMedia = args.includes("--media");
const apiKey = process.env[keyName];
if (!apiKey) {
  console.error(`no key: set ${keyName}`);
  process.exit(2);
}

/** Every key this run uses, so each can be redacted from anything printed. */
const extraKeys = [];
const redact = (s) => [apiKey, ...extraKeys].reduce((out, k) => out.split(k).join("[redacted]"), String(s));
const entry = process.env.WAVE_SDK_ENTRY ?? new URL("../dist/index.mjs", import.meta.url).href;
const sdk = await import(entry);
const { Wave, PaymentRequiredError, RouteNotServedError } = sdk;

// Record every HTTP exchange so each check can cite the gateway's request id.
const exchanges = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const res = await realFetch(input, init);
  exchanges.push({ method: init?.method ?? "GET", url, status: res.status, rid: res.headers.get("x-request-id") });
  return res;
};

const wave = new Wave({ apiKey, maxRetries: 0 });
const results = [];

async function check(label, fn, assert) {
  const before = exchanges.length;
  let value;
  let error;
  try {
    value = await fn();
  } catch (e) {
    error = e;
  }
  const seen = exchanges.slice(before).map((x) => `${x.method} ${x.url.split("?")[0]} -> ${x.status} [${x.rid ?? "-"}]`);
  let verdict;
  try {
    verdict = assert(value, error);
  } catch (e) {
    verdict = `assertion threw: ${e instanceof Error ? e.message : e}`;
  }
  const ok = verdict === true;
  const errText = error
    ? ` ${error.name ?? "Error"} status=${error.statusCode ?? "-"} code=${error.code ?? "-"} ${error.message ?? ""}`
    : "";
  console.log(redact(`${ok ? "PASS" : "FAIL"} ${label}${ok ? "" : ` (${verdict})`}${errText}`));
  for (const line of seen) console.log(redact(`     ${line}`));
  results.push({ label, ok });
  return value;
}

const isObj = (v) => v !== null && typeof v === "object";
const expectValue = (pred, what) => (v, e) => (e ? `expected ${what}, got an error` : pred(v) ? true : `expected ${what}`);
const expectError = (cls, codes) => (v, e) => {
  if (!e) return `expected ${cls.name}, got a value`;
  if (!(e instanceof cls)) return `expected ${cls.name}, got ${e?.name}`;
  return codes.includes(e.code) ? true : `expected code in [${codes}], got ${e.code}`;
};

// Controls: routes known to be served. If these fail, nothing below can be judged.
await check(
  "control GET /v1/network/surface",
  () => wave.client.get("/v1/network/surface"),
  expectValue((v) => isObj(v) && typeof v.product === "string", "a surface document with `product`"),
);
await check(
  "control GET /v1/x402/facilitator/supported",
  () => wave.client.get("/v1/x402/facilitator/supported"),
  expectValue((v) => isObj(v) && Array.isArray(v.supportedNetworks), "`supportedNetworks[]`"),
);
if (!results.every((r) => r.ok)) {
  console.error("controls failed: the gateway is not answering as expected; no other result is meaningful");
  process.exit(2);
}

// The README quickstart, call by call.
const models = await check(
  "inference.models()",
  () => wave.inference.models(),
  expectValue((v) => Array.isArray(v) && v.length > 0 && typeof v[0].id === "string", "a non-empty [{ id, ownedBy }]"),
);
if (runComplete && Array.isArray(models) && models.length) {
  await check(
    `inference.complete("${models[0].id}", 8 tokens)`,
    () => wave.inference.complete(models[0].id, [{ role: "user", content: "Reply with one word: ok" }], 8),
    expectValue((v) => isObj(v) && typeof v.content === "string" && typeof v.model === "string", "{ model, content }"),
  );
}
await check(
  "meter.ledger()",
  () => wave.meter.ledger(),
  expectValue(
    (v) => isObj(v) && typeof v.org === "string" && isObj(v.channels) && typeof v.generated_at === "string",
    "{ org, from, to, channels, generated_at }",
  ),
);
await check(
  "meter.rollup()",
  () => wave.meter.rollup(),
  expectValue((v) => isObj(v) && isObj(v.totals) && typeof v.period === "string", "{ period, totals }"),
);
await check(
  'realtime.history("stream:demo", 10)',
  () => wave.realtime.history("stream:demo", 10),
  expectValue((v) => isObj(v) && v.channel === "stream:demo" && Array.isArray(v.events), "{ channel, events[] }"),
);
await check(
  'realtime.presence("stream:demo")',
  () => wave.realtime.presence("stream:demo"),
  expectValue((v) => isObj(v) && Array.isArray(v.members), "{ channel, members[] }"),
);

// The realtime socket, on runtimes whose WebSocket can send the Authorization header (Node 22+).
if (typeof globalThis.WebSocket === "function") {
  await check(
    'realtime.connect("stream:demo") -> welcome frame',
    () =>
      new Promise((resolve, reject) => {
        const ch = wave.realtime.connect("stream:demo", { reconnect: false });
        const timer = setTimeout(() => {
          ch.close();
          reject(new Error("no frame within 20s"));
        }, 20_000);
        ch.on("message", (frame) => {
          clearTimeout(timer);
          ch.close();
          resolve(frame);
        });
        ch.on("close", (c) => {
          clearTimeout(timer);
          reject(new Error(`socket closed before a frame: ${JSON.stringify(c)}`));
        });
      }),
    expectValue((f) => isObj(f) && f.type === "welcome" && f.channel === "stream:demo", "a welcome frame for stream:demo"),
  );
}

// Typed errors: what a caller sees on routes that are not served, or not payable, today.
await check(
  "pipeline.list() -> RouteNotServedError",
  () => wave.pipeline.list({ limit: 1 }),
  expectError(RouteNotServedError, ["ROUTE_NOT_FOUND"]),
);
await check(
  "mail.search() -> RouteNotServedError",
  () => wave.mail.search("smoke"),
  expectError(RouteNotServedError, ["ROUTE_NOT_MAPPED"]),
);
await check(
  "inference.profile() -> RouteNotServedError, no network call",
  () => wave.inference.profile("any"),
  expectError(RouteNotServedError, ["ROUTE_NOT_SERVED"]),
);
await check(
  "captions.translate() -> RouteNotServedError, no network call",
  () => wave.captions.translate("any", { target_language: "es" }),
  expectError(RouteNotServedError, ["ROUTE_NOT_SERVED"]),
);

// Reads on the media edges. A key whose org is at its spend cap gets a 402 before routing, so a
// 402 that keeps the gateway code passes; it proves the error is typed, not that the route serves.
const readOrCapped = (pred, what) => (v, e) => {
  if (!e) return pred(v) ? true : `expected ${what}`;
  if (e instanceof PaymentRequiredError) return e.code !== "HTTP_402" ? true : "402 lost the gateway code";
  // Anything else (404 not served, 401/403 access) means the documented read did not work.
  return `unexpected ${e?.name}: status=${e?.statusCode} code=${e?.code}`;
};
const isPage = (v) => isObj(v) && Array.isArray(v.data) && isObj(v.pagination);
await check("clips.list() -> a page, or a 402 that keeps the gateway code", () => wave.clips.list({ perPage: 1 }), readOrCapped(isPage, "{ data[], pagination }"));
await check("captions.list() -> a page, or a 402 that keeps the gateway code", () => wave.captions.list({ perPage: 1 }), readOrCapped(isPage, "{ data[], pagination }"));
await check("transcribe.list() -> a page, or a 402 that keeps the gateway code", () => wave.transcribe.list({ perPage: 1 }), readOrCapped(isPage, "{ data[], pagination }"));
await check("voice.listVoices() -> voices, or a 402 that keeps the gateway code", () => wave.voice.listVoices(), readOrCapped(Array.isArray, "Voice[]"));

// --media: the README captions and transcription flows end to end, on a 3-second public speech
// sample (billed: a few seconds of transcription and captioning, well under one cent). Each flow
// cleans up after itself. --transcribe-key-env / --captions-key-env name a key with that product's
// write scope when the main key lacks it.
if (runMedia) {
  const SAMPLE = "https://raw.githubusercontent.com/mozilla/DeepSpeech/master/data/smoke_test/LDC93S1.wav";
  const waveFor = (flag) => {
    const name = argValue(flag);
    const k = name ? process.env[name] : apiKey;
    if (!k) throw new Error(`${flag} ${name}: variable is not set`);
    extraKeys.push(k);
    return new Wave({ apiKey: k, maxRetries: 0 });
  };
  const tw = waveFor("--transcribe-key-env");
  const job = await check(
    "transcribe.create(3s public sample) -> completed with text",
    () => tw.transcribe.create({ sourceId: SAMPLE, sourceType: "audio", speakerLabels: true }),
    expectValue((v) => isObj(v) && v.status === "completed" && typeof v.text === "string" && v.text.length > 0, "a completed job with text"),
  );
  if (isObj(job) && typeof job.id === "string") {
    await check("transcribe.getText(id)", () => tw.transcribe.getText(job.id), expectValue((t) => t === job.text, "the job's text"));
    await check("transcribe.remove(id)", () => tw.transcribe.remove(job.id), (v, e) => (e ? `remove failed: ${e.code}` : true));
  }
  const cw = waveFor("--captions-key-env");
  const cap = await check(
    "captions.create(3s public sample) -> completed",
    () => cw.captions.create({ videoId: SAMPLE, sourceLanguage: "en" }),
    expectValue((v) => isObj(v) && v.status === "completed" && isObj(v.outputs) && "en" in v.outputs, "a completed job with an en output"),
  );
  if (isObj(cap) && typeof cap.id === "string") {
    await check(
      "captions.download(id, srt)",
      () => cw.captions.download(cap.id, { language: "en", format: "srt" }),
      expectValue((s) => typeof s === "string" && s.includes("-->"), "SRT content with a cue"),
    );
    await check("captions.remove(id)", () => cw.captions.remove(cap.id), (v, e) => (e ? `remove failed: ${e.code}` : true));
  }
}

// The wave-sdk bin, when this checkout's build is under test.
const bin = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
if (!process.env.WAVE_SDK_ENTRY && existsSync(bin)) {
  const run = (argv, env) => spawnSync(process.execPath, [bin, ...argv], { env, encoding: "utf8", timeout: 60_000 });
  const base = { PATH: process.env.PATH ?? "" };
  const withKey = run(["models"], { ...base, WAVE_API_KEY: apiKey });
  const modelLines = withKey.stdout.split("\n").filter((l) => l.trim().length > 0);
  const ok1 = withKey.status === 0 && modelLines.length > 0 && !withKey.stdout.includes(apiKey);
  console.log(`${ok1 ? "PASS" : "FAIL"} wave-sdk models (WAVE_API_KEY set) exit=${withKey.status} models=${modelLines.length}`);
  if (!ok1) console.log(redact(`     stderr: ${withKey.stderr.trim()}`));
  results.push({ label: "wave-sdk models", ok: ok1 });

  const noKey = run(["complete", "hi"], base);
  const ok2 = noKey.status === 2 && /WAVE_API_KEY/.test(noKey.stderr);
  console.log(`${ok2 ? "PASS" : "FAIL"} wave-sdk complete (no key) exit=${noKey.status} -> ${noKey.stderr.trim()}`);
  results.push({ label: "wave-sdk complete without key", ok: ok2 });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
globalThis.fetch = realFetch;
process.exit(failed.length ? 1 : 0);
