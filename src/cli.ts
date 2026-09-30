/**
 * `wave-sdk` CLI — thin arg parsing + dispatch over RuntimeClient.
 *
 * The human shell-control rung of the API-first ladder: the CLI does no HTTP of its own; it calls
 * the SDK's RuntimeClient, so the door's contract lives in one place. Subcommands mirror the SDK:
 * `models` (list), `complete <prompt>` (one-shot), `stream <prompt>` (SSE). Returns
 * { code, out, err? } so the bin entry (src/bin.ts) and tests both consume the same function; it
 * never rejects — a failed call becomes exit code 1 with a one-line message on `err`.
 *
 * This module is a pure library — no top-level side effects, no bin-entry guard. It is re-exported
 * from `./index`, so tsup/esbuild's ESM code-splitting places it in a chunk shared by every entry
 * that touches it (index.mjs, bin.mjs, ...). A CJS-only guard like `require.main === module` living
 * here previously ended up executed at import time for *any* ESM consumer of `@wave-av/sdk` — see
 * CHANGELOG for the incident. Keep the bin-only side effect confined to src/bin.ts, which is never
 * imported by anything else and therefore never gets bundled into a shared chunk.
 */
import { RuntimeClient } from "./runtime";
import { listProducts, ProductClient } from "./products";
import { TranscriptAPI } from "./transcripts";
import { WaveClient } from "./client";

/**
 * The OpenAI-compatible door `models`, `complete` and `stream` call by default: the WAVE API
 * gateway's inference routes, which authenticate the same WAVE API key as the rest of the SDK.
 * Set WAVE_RUNTIME_URL to use another door (e.g. https://runtime.wave.online/v1).
 */
export const DEFAULT_RUNTIME_URL = "https://api.wave.online/v1/inference";
/** The WAVE API gateway, for API-backed commands such as `transcripts`. */
export const DEFAULT_API_BASE_URL = "https://api.wave.online";

export interface WaveCliOptions {
  /** OpenAI-compatible door base URL (models, complete, stream); default DEFAULT_RUNTIME_URL. */
  baseUrl: string;
  /** WAVE API key. Sent as a Bearer token; required by complete, stream and transcripts. */
  token?: string;
  /** WAVE API base URL for API-backed commands (default https://api.wave.online). */
  apiBaseUrl?: string;
  /** Model for complete/stream when `--model` is not given. */
  model?: string;
  /** fetch used for the runtime door (tests inject a stub). */
  fetchImpl?: typeof fetch;
}

export interface WaveCliResult {
  code: number;
  out: string;
  /** One-line error for stderr, when the command failed. */
  err?: string;
}

const USAGE =
  "usage: wave-sdk <models|complete|stream|products> [--model <id>] [prompt] | wave-sdk product <id> <path>\n" +
  "       wave-sdk transcripts <list <org> | get <org> <room> <session>>\n" +
  "env:   WAVE_API_KEY (required for models, complete, stream, transcripts), WAVE_MODEL,\n" +
  "       WAVE_RUNTIME_URL (default " + DEFAULT_RUNTIME_URL + "), WAVE_BASE_URL (default " + DEFAULT_API_BASE_URL + ")\n";

/** Map the process environment to CLI options. Pure, so it is testable without a subprocess. */
export function cliOptionsFromEnv(env: Record<string, string | undefined>): WaveCliOptions {
  return {
    baseUrl: env.WAVE_RUNTIME_URL || DEFAULT_RUNTIME_URL,
    apiBaseUrl: env.WAVE_BASE_URL || DEFAULT_API_BASE_URL,
    token: env.WAVE_API_KEY || undefined,
    model: env.WAVE_MODEL || undefined,
  };
}

/** Split `--model <id>` / `--model=<id>` out of argv. */
function takeModelFlag(args: string[]): { model?: string; rest: string[] } {
  const rest: string[] = [];
  let model: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--model" || a === "-m") {
      model = args[++i];
    } else if (a.startsWith("--model=")) {
      model = a.slice("--model=".length);
    } else {
      rest.push(a);
    }
  }
  return { model, rest };
}

/**
 * Shortest token redact() rewrites. Real WAVE keys are far longer; redacting a one- or two-character
 * value would corrupt every message that happens to contain those characters.
 */
const MIN_REDACT_LENGTH = 8;

/** Never let a credential reach the terminal, even if an upstream echoes it back. */
export function redact(message: string, token?: string): string {
  return token && token.length >= MIN_REDACT_LENGTH ? message.split(token).join("[redacted]") : message;
}

async function resolveModel(client: RuntimeClient, explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const models = await client.models();
  if (!models.length) throw new Error("the runtime lists no models; pass --model <id>");
  return models[0];
}

async function dispatch(argv: string[], opts: WaveCliOptions): Promise<WaveCliResult> {
  const client = new RuntimeClient({ baseUrl: opts.baseUrl, token: opts.token, fetchImpl: opts.fetchImpl });
  const [cmd, ...args] = argv;
  const { model: modelFlag, rest } = takeModelFlag(args);
  const needKey = (what: string): WaveCliResult => ({
    code: 2,
    out: "",
    err: `wave-sdk ${what}: an API key is required (set WAVE_API_KEY)\n`,
  });

  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      return { code: 0, out: USAGE };

    case "models": {
      // The gateway door needs the key even to list models; another door (WAVE_RUNTIME_URL) may not.
      if (!opts.token && opts.baseUrl === DEFAULT_RUNTIME_URL) return needKey("models");
      const models = await client.models();
      return { code: 0, out: models.join("\n") + (models.length ? "\n" : "") };
    }

    case "complete": {
      const prompt = rest.join(" ");
      if (!prompt) return { code: 2, out: USAGE };
      if (!opts.token) return needKey("complete");
      const model = await resolveModel(client, modelFlag ?? opts.model);
      const res = await client.complete({ model, messages: [{ role: "user", content: prompt }] });
      return { code: 0, out: (res.choices[0]?.message?.content ?? "") + "\n" };
    }

    case "stream": {
      const prompt = rest.join(" ");
      if (!prompt) return { code: 2, out: USAGE };
      if (!opts.token) return needKey("stream");
      const model = await resolveModel(client, modelFlag ?? opts.model);
      let out = "";
      for await (const chunk of client.stream({ model, messages: [{ role: "user", content: prompt }] })) {
        const delta = (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
        if (delta) out += delta;
      }
      return { code: 0, out: out + "\n" };
    }

    case "products": {
      const rows = listProducts().map((p) => `${p.id}\t${p.phase}\t${p.surface}`);
      return { code: 0, out: rows.join("\n") + "\n" };
    }

    case "product": {
      const [id, path] = rest;
      if (!id || !path) return { code: 2, out: "usage: wave-sdk product <id> <path>\n" };
      const pc = new ProductClient({ productId: id, token: opts.token });
      const res = await pc.call<unknown>(path, { method: "GET" });
      return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
    }

    case "transcripts": {
      const [sub, org, room, session] = rest;
      if (!opts.token) return needKey("transcripts");
      const api = new TranscriptAPI(
        new WaveClient({ apiKey: opts.token, baseUrl: opts.apiBaseUrl || DEFAULT_API_BASE_URL }),
      );
      if (sub === "list" && org) {
        const res = await api.list(org);
        return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
      }
      if (sub === "get" && org && room && session) {
        const res = await api.get(org, room, session);
        return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
      }
      return { code: 2, out: "usage: wave-sdk transcripts <list <org> | get <org> <room> <session>>\n" };
    }

    default:
      return { code: 2, out: USAGE };
  }
}

export async function runWaveCli(argv: string[], opts: WaveCliOptions): Promise<WaveCliResult> {
  try {
    return await dispatch(argv, opts);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { code: 1, out: "", err: `wave-sdk ${argv[0] ?? ""}: ${redact(message, opts.token)}\n` };
  }
}
