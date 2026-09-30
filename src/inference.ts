/**
 * WAVE SDK - Inference API
 *
 * OpenAI-compatible completions and the model list, served by the WAVE gateway at
 * `POST /v1/inference/chat/completions` and `GET /v1/inference/models` (the product-noun alias of
 * the gateway's dispatch routes). Calls go through WaveClient, so they carry the same WAVE API key,
 * organization header, retries, timeouts, and typed WaveError failures as every other module.
 * Auth, budgets, guardrails, and metering are enforced by the gateway.
 */

import type { WaveClient } from "./client";
import { RouteNotServedError } from "./errors";

/** A chat message, OpenAI-compatible shape. */
export interface InferenceMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

/** One completion. */
export interface InferenceResult {
  /** The model that actually served (may differ from the request after fallback). */
  model: string;
  content: string;
  /** Spend for THIS call in USD, when the gateway reports it in `usage.cost`; otherwise null. */
  cost: number | null;
  totalTokens: number;
}

/** One entry from `GET /v1/inference/models`. */
export interface InferenceModel {
  id: string;
  /** The rail that serves the model, from the OpenAI-compatible `owned_by` field. */
  ownedBy: string;
}

/** A model's measured profile. No served route returns this yet; see `InferenceAPI.profile()`. */
export interface ModelProfile {
  id: string;
  rail: string;
  status: string;
  /** Measured floor→ceiling (the synthetic→real capability delta). Null = pending bench. */
  transition: { floor: number | null; ceiling: number | null };
  pricing: { inputPerM: number | null; outputPerM: number | null };
  liveUsage: { calls: number; spentUsd: number; avgLatencyMs: number | null };
}

/** Path of the inference plane under the API base URL. */
export const INFERENCE_PATH = "/v1/inference";

interface ChatCompletionBody {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { cost?: number | null; total_tokens?: number };
}

export class InferenceAPI {
  constructor(private client: WaveClient) {}

  /**
   * One completion. `POST /v1/inference/chat/completions`.
   * Throws WaveError on a non-2xx answer (e.g. 400 `model_required`, 402 spend cap).
   */
  async complete(model: string, messages: InferenceMessage[], maxTokens = 1024): Promise<InferenceResult> {
    const d = await this.client.post<ChatCompletionBody>(
      `${INFERENCE_PATH}/chat/completions`,
      { model, messages, max_tokens: maxTokens, stream: false },
      { timeout: 120_000 },
    );
    const u = d.usage ?? {};
    return {
      model: d.model ?? model,
      content: d.choices?.[0]?.message?.content ?? "",
      cost: typeof u.cost === "number" ? u.cost : null,
      totalTokens: u.total_tokens ?? 0,
    };
  }

  /** Models the gateway routes to. `GET /v1/inference/models`. */
  async models(): Promise<InferenceModel[]> {
    const body = await this.client.get<{ data?: Array<{ id: string; owned_by?: string }> }>(
      `${INFERENCE_PATH}/models`,
    );
    return (body.data ?? []).map((m) => ({ id: m.id, ownedBy: m.owned_by ?? "" }));
  }

  /**
   * A model's measured profile. The gateway does not serve a profile route yet, so this throws
   * RouteNotServedError without making a network call. (Before 3.0.0 it read WAVE's internal model
   * registry directly with a database key, which no customer holds, and always failed.)
   */
  async profile(modelId: string): Promise<ModelProfile> {
    throw new RouteNotServedError(
      `inference.profile(${JSON.stringify(modelId)}): no served route returns model profiles yet. ` +
        `The gateway serves POST ${INFERENCE_PATH}/chat/completions and GET ${INFERENCE_PATH}/models.`,
      "ROUTE_NOT_SERVED",
    );
  }
}
