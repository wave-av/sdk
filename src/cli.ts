#!/usr/bin/env node
/**
 * `wave` CLI — thin arg parsing + dispatch over RuntimeClient.
 *
 * The human shell-control rung of the API-first ladder: the CLI does no HTTP of its own; it calls
 * the SDK's RuntimeClient, so the door's contract lives in one place. Subcommands mirror the SDK:
 * `models` (list), `complete <prompt>` (one-shot), `stream <prompt>` (SSE). Returns { code, out }
 * so the bin entry and tests both consume the same function.
 */
import { RuntimeClient } from "./runtime";
import { listProducts, ProductClient } from "./products";
import { TranscriptAPI } from "./transcripts";
import { WaveClient } from "./client";

export interface WaveCliOptions {
  baseUrl: string;
  token?: string;
}

export interface WaveCliResult {
  code: number;
  out: string;
}

const USAGE = "usage: wave <models|complete|stream|products> [prompt] | wave product <id> <path>\n";

export async function runWaveCli(argv: string[], opts: WaveCliOptions): Promise<WaveCliResult> {
  const client = new RuntimeClient({ baseUrl: opts.baseUrl, token: opts.token });
  const [cmd, ...rest] = argv;

  switch (cmd) {
    case "models": {
      const models = await client.models();
      return { code: 0, out: models.join("\n") + (models.length ? "\n" : "") };
    }

    case "complete": {
      const prompt = rest.join(" ");
      if (!prompt) return { code: 2, out: USAGE };
      const res = await client.complete({ messages: [{ role: "user", content: prompt }] });
      return { code: 0, out: (res.choices[0]?.message?.content ?? "") + "\n" };
    }

    case "stream": {
      const prompt = rest.join(" ");
      if (!prompt) return { code: 2, out: USAGE };
      let out = "";
      for await (const chunk of client.stream({ messages: [{ role: "user", content: prompt }] })) {
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
      if (!id || !path) return { code: 2, out: "usage: wave product <id> <path>\n" };
      const pc = new ProductClient({ productId: id, token: opts.token });
      const res = await pc.call<unknown>(path, { method: "GET" });
      return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
    }

    case "transcripts": {
      const [sub, org, room, session] = rest;
      if (!opts.token) return { code: 2, out: "wave transcripts: an API key is required\n" };
      const api = new TranscriptAPI(new WaveClient({ apiKey: opts.token, baseUrl: opts.baseUrl }));
      if (sub === "list" && org) {
        const res = await api.list(org);
        return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
      }
      if (sub === "get" && org && room && session) {
        const res = await api.get(org, room, session);
        return { code: 0, out: JSON.stringify(res, null, 2) + "\n" };
      }
      return { code: 2, out: "usage: wave transcripts <list <org> | get <org> <room> <session>>\n" };
    }

    default:
      return { code: 2, out: USAGE };
  }
}
