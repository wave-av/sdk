/**
 * WAVE SDK - Inference API (the funnel rendering)
 *
 * One OpenAI-compatible completion endpoint fronting 13 providers — measured routing,
 * automatic failover, per-token metering. The SDK forwards your key; auth, budgets,
 * guardrails, and spend tracking are enforced by the funnel plane
 * (inference.wave.online → LiteLLM on Fly → dedicated Postgres).
 *
 * The routing decision is MEASURED: every model carries a floor→ceiling transition
 * profile in the registry. `profile()` returns it alongside live usage.
 */

import type { WaveClient } from "./client";

/** A chat message, OpenAI-compatible shape. */
export interface InferenceMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

/** One completion through the measured funnel. */
export interface InferenceResult {
  /** The model that actually served (may differ from the request after fallback). */
  model: string;
  content: string;
  /** Spend for THIS call, USD to eight decimals (from the funnel's metering). */
  cost: number | null;
  totalTokens: number;
}

/** A model's measured profile — the transition signature + pricing + live usage. */
export interface ModelProfile {
  id: string;
  rail: string;
  status: string;
  /** Measured floor→ceiling (the synthetic→real capability delta). Null = pending bench. */
  transition: { floor: number | null; ceiling: number | null };
  pricing: { inputPerM: number | null; outputPerM: number | null };
  liveUsage: { calls: number; spentUsd: number; avgLatencyMs: number | null };
}

export class InferenceAPI {
  constructor(private client: WaveClient) {}

  /** One completion through the measured funnel. Throws on HTTP errors (OpenAI-compatible body). */
  async complete(model: string, messages: InferenceMessage[], maxTokens = 1024): Promise<InferenceResult> {
    const res = await fetch(`${this.funnelBase()}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.client.getConnectionInfo().apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`inference ${res.status}: ${body.slice(0, 300)}`);
    }
    const d: any = await res.json();
    const u = d.usage ?? {};
    return {
      model: d.model ?? model,
      content: d.choices?.[0]?.message?.content ?? "",
      cost: u.cost ?? null,
      totalTokens: u.total_tokens ?? 0,
    };
  }

  /** Models admitted to the registry with their per-token pricing. */
  async models(): Promise<Array<{ id: string; rail: string; inputPerM: number | null; outputPerM: number | null }>> {
    const url = this.registryUrl();
    const rows = await this.registryGet(`${url}/rest/v1/models?select=id,rail,cost_input_per_m,cost_output_per_m&limit=1000`);
    return rows.map((m: any) => ({ id: m.id, rail: m.rail, inputPerM: m.cost_input_per_m, outputPerM: m.cost_output_per_m }));
  }

  /** A model's measured profile: the transition signature + pricing + live usage. */
  async profile(modelId: string): Promise<ModelProfile> {
    const url = this.registryUrl();
    const m = await this.registryGet(`${url}/rest/v1/models?select=*&id=eq.${encodeURIComponent(modelId)}`);
    if (!m.length) throw new Error(`model ${modelId}: NOT ADMITTED`);
    const row = m[0];
    const h = row.health ?? {};
    const usage = await this.registryGet(`${url}/rest/v1/usage_logs?select=cost,latency_ms&model_id=eq.${encodeURIComponent(modelId)}&limit=1000`);
    const lat = usage.map((x: any) => x.latency_ms).filter(Boolean) as number[];
    return {
      id: row.id,
      rail: row.rail,
      status: row.status,
      transition: { floor: h.floor ?? null, ceiling: h.ceiling ?? null },
      pricing: { inputPerM: row.cost_input_per_m, outputPerM: row.cost_output_per_m },
      liveUsage: {
        calls: usage.length,
        spentUsd: usage.reduce((a: number, x: any) => a + Number(x.cost || 0), 0),
        avgLatencyMs: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null,
      },
    };
  }

  private funnelBase(): string {
    // the funnel front door (branded edge → LiteLLM); overridable for local dev
    return (this.client as any)._config?.funnelUrl as string || "https://inference.wave.online";
  }

  private registryUrl(): string {
    return (this.client as any)._config?.supabaseUrl as string || "";
  }

  private async registryGet(path: string): Promise<any> {
    const key = (this.client as any)._config?.supabaseKey as string || "";
    const res = await fetch(path, { headers: { apikey: key }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`registry ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
}
