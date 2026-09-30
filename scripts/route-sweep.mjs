#!/usr/bin/env node
/**
 * Route sweep: which SDK modules reach a route the gateway serves, measured, not declared.
 *
 *   npm run build && node scripts/route-sweep.mjs [--check] [--json FILE] [--key-env NAME]
 *
 * 1. Extract. Instantiate `Wave` with a dummy key and fetch stubbed, call every method of every
 *    module with placeholder arguments, and record each (method, path) it would send. A method
 *    that throws RouteNotServedError without calling fetch is recorded as `gated`.
 * 2. Probe. Send each unique route to the gateway WITHOUT credentials (placeholder ids, `{}`
 *    bodies), so nothing is created, changed or billed, and classify the answer by status and
 *    gateway code only. Response bodies are never printed.
 *      unserved  404 ROUTE_NOT_FOUND / ROUTE_NOT_MAPPED: no capability at this path
 *      priced    402: the route is priced (x402). Priced is not proof of served.
 *      auth      401 / 403: an auth or scope rule exists for the route
 *      other     anything else (400, 405, 200, 5xx)
 *    The gateway also answers ROUTE_NOT_FOUND to an UNAUTHENTICATED call on some routes it does
 *    serve (measured: GET /v1/inference/models is 404 without a key and 200 with one), so an
 *    unauthenticated `unserved` is not conclusive. With --key-env NAME, every GET route is probed
 *    again with the key in NAME (reads only) and that answer wins. Other methods are never sent
 *    with a key.
 * 3. Compare, per module:
 *      past-route-check  some route was priced, answered auth, or anything but a route 404
 *      unserved          every route is gated or unserved, and a GET confirmed it with a key
 *      unserved?         every route is gated or unserved, but only without a key: inconclusive
 *    A module that measures `unserved` should be `planned` in .wave/repo.json. `--check` exits 1
 *    when a module marked `lib` or `ga` measures `unserved`, and names (without failing)
 *    `sdk-surface` modules that measure `unserved`. It never acts on `unserved?`.
 *
 * The SDK is loaded from WAVE_SDK_ENTRY when set, else from this checkout's dist/.
 * WAVE_SWEEP_BASE_URL overrides the gateway (default https://api.wave.online).
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const check = args.includes("--check");
const jsonOut = flag("--json");
const keyEnv = flag("--key-env");
const key = keyEnv ? process.env[keyEnv] : undefined;
if (keyEnv && !key) {
  console.error(`--key-env ${keyEnv}: variable is not set`);
  process.exit(2);
}
const base = (process.env.WAVE_SWEEP_BASE_URL ?? "https://api.wave.online").replace(/\/+$/, "");
const entry = process.env.WAVE_SDK_ENTRY ?? new URL("../dist/index.mjs", import.meta.url).href;
const { Wave, RouteNotServedError } = await import(entry);

// ---------------------------------------------------------------- 1. extract
const realFetch = globalThis.fetch;
let current = null;
const sent = new Map(); // "module.method" -> Set("METHOD /path")
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  if (current) sent.get(current).add(`${(init.method ?? "GET").toUpperCase()} ${url.pathname}`);
  return new Response(JSON.stringify({ id: "x", data: [], items: [], voices: [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
globalThis.WebSocket = class {
  constructor(u) {
    if (current) sent.get(current).add(`WS ${new URL(u).pathname}`);
  }
  addEventListener() {}
  send() {}
  close() {}
};

const wave = new Wave({ apiKey: "route-sweep-placeholder", maxRetries: 0, timeout: 500 });
const argSets = [
  ["id_a", "id_b", "id_c"],
  [{ id: "id_a", text: "t", name: "n", title: "t", source: "id_a", in: "0s", out: "5s", videoId: "id_a" }, {}],
  ["id_a", { text: "t", name: "n" }, {}],
  [],
];
const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
const methods = [];
for (const mod of Object.keys(wave).filter((k) => k !== "client")) {
  const api = wave[mod];
  if (!api || typeof api !== "object") continue;
  const names = Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(
    (n) => n !== "constructor" && typeof api[n] === "function" && !n.startsWith("_") && !/^waitFor/.test(n),
  );
  for (const name of names) {
    const id = `${mod}.${name}`;
    sent.set(id, new Set());
    let gated = false;
    for (const a of argSets) {
      current = id;
      try {
        const r = api[name](...a);
        if (r && typeof r.then === "function") {
          await within(
            r.catch((e) => {
              if (e instanceof RouteNotServedError && e.code === "ROUTE_NOT_SERVED") gated = true;
            }),
            600,
          );
        }
      } catch (e) {
        if (e instanceof RouteNotServedError && e.code === "ROUTE_NOT_SERVED") gated = true;
      }
      if (sent.get(id).size || gated) break;
    }
    current = null;
    methods.push({ module: mod, method: name, gated, routes: [...sent.get(id)] });
  }
}
globalThis.fetch = realFetch;

// ---------------------------------------------------------------- 2. probe
const placeholder = (path) => path.replace(/\/(id_[abc]|x|route-sweep-placeholder)(?=\/|$)/g, "/sweep_x");
const unique = [...new Set(methods.flatMap((m) => m.routes).filter((r) => !r.startsWith("WS ")))];
const verdicts = new Map();
async function probe(route, withKey) {
  const [method, path] = route.split(" ");
  const headers = { accept: "application/json", "user-agent": "wave-sdk-route-sweep" };
  if (withKey) headers.authorization = `Bearer ${key}`;
  const init = { method, headers, redirect: "manual" };
  if (["POST", "PUT", "PATCH"].includes(method)) {
    init.body = "{}";
    headers["content-type"] = "application/json";
  }
  try {
    const res = await fetch(base + placeholder(path), init);
    let code = "";
    try {
      const b = await res.json();
      code = (b?.error && typeof b.error === "object" ? b.error.code : b?.code) ?? (b?.x402Version ? "X402" : "");
    } catch {
      /* non-JSON: status alone classifies it */
    }
    return { status: res.status, code: String(code ?? "") };
  } catch (e) {
    return { status: 0, code: e?.cause?.code ?? "FETCH_FAILED" };
  }
}
const classify = ({ status, code }) =>
  status === 404 && /^ROUTE_NOT_(FOUND|MAPPED)$/.test(code)
    ? "unserved"
    : status === 402
      ? "priced"
      : status === 401 || status === 403
        ? "auth"
        : "other";
for (let i = 0; i < unique.length; i += 6) {
  await Promise.all(
    unique.slice(i, i + 6).map(async (route) => {
      const keyed = Boolean(key) && route.startsWith("GET ");
      const r = await probe(route, keyed);
      verdicts.set(route, { ...r, kind: classify(r), keyed });
    }),
  );
}

// ---------------------------------------------------------------- 3. compare
const ssot = JSON.parse(readFileSync(new URL("../.wave/repo.json", import.meta.url), "utf8"));
const declared = new Map();
for (const s of ssot.sections ?? []) {
  if (s.kind !== "table" || !/^API modules/.test(s.heading)) continue;
  for (const row of s.rows) declared.set(row[0].replace(/[`]/g, "").replace(/^wave\./, ""), row[2]);
}
const modules = new Map();
for (const m of methods) {
  const e = modules.get(m.module) ?? {
    module: m.module,
    methods: 0,
    gated: 0,
    unserved: 0,
    priced: 0,
    auth: 0,
    other: 0,
    ws: 0,
    keyedUnserved: 0,
  };
  e.methods++;
  if (m.gated) e.gated++;
  for (const r of m.routes) {
    if (r.startsWith("WS ")) {
      e.ws++;
      continue;
    }
    const v = verdicts.get(r);
    e[v.kind]++;
    if (v.kind === "unserved" && v.keyed) e.keyedUnserved++;
  }
  modules.set(m.module, e);
}
let drift = 0;
const rows = [...modules.values()].map((e) => {
  const reached = e.priced + e.auth + e.other + e.ws;
  const measured =
    reached > 0 ? "past-route-check" : e.keyedUnserved > 0 ? "unserved" : e.unserved + e.gated > 0 ? "unserved?" : "no-route";
  const status = declared.get(e.module) ?? "-";
  let note = "";
  if (measured === "unserved" && (status === "lib" || status === "ga")) {
    note = "DRIFT: declared served, measures unserved";
    drift++;
  } else if (measured === "unserved" && status === "sdk-surface") note = "measures unserved: mark planned";
  return { ...e, measured, status, note };
});
console.log(`gateway ${base}${key ? ` (GET routes probed with ${keyEnv}, others without a key)` : " (no key: unserved results are inconclusive)"}`);
console.log("module".padEnd(15), "status".padEnd(12), "measured".padEnd(17), "gated unserved priced auth other ws  note");
for (const r of rows.sort((a, b) => a.module.localeCompare(b.module))) {
  console.log(
    r.module.padEnd(15),
    r.status.padEnd(12),
    r.measured.padEnd(17),
    [r.gated, r.unserved, r.priced, r.auth, r.other, r.ws].map((n) => String(n).padStart(5)).join(""),
    "",
    r.note,
  );
}
if (jsonOut) {
  const routes = Object.fromEntries([...verdicts].map(([route, v]) => [route, v]));
  writeFileSync(jsonOut, JSON.stringify({ base, authenticatedGets: Boolean(key), modules: rows, methods, routes }, null, 1));
}
console.log(`\n${unique.length} routes probed, ${rows.length} modules, ${drift} drift`);
process.exit(check && drift > 0 ? 1 : 0);
