/**
 * WAVE SDK - Pricing Pages API
 *
 * The seller tier-manifest registry (pricing-pages E0): create, list, and read
 * manifests for your org. The rail law is enforced server-side — sub-$0.50 tiers
 * must be x402, card requires ≥ $0.50 — so a rejected manifest is a law violation,
 * never a silent repricing.
 *
 * Requires scopes `pricing:write` (create) and `pricing:read` (list/get).
 * Hosted pages render at `pricing.wave.online/<slug>` for published manifests.
 */

import type { WaveClient } from "./client";
import type {
  PricingManifest,
  ManifestCreateResult,
  ManifestList,
  ManifestRead,
} from "./pricing-types";

export type {
  PricingTier,
  PricingManifest,
  ManifestCreateResult,
  ManifestListEntry,
  ManifestList,
  ManifestRead,
} from "./pricing-types";

/** @example
 * const pricing = new Wave({ apiKey: "your-key" }).pricing;
 * const created = await pricing.createManifest({
 *   slug: "acme-news",
 *   title: "Acme News",
 *   tiers: [{ id: "L1", name: "Per article", price_usdc_micro: "400", rail: "x402", billing: "per_op", features: ["delivered"] }],
 * });
 * const page = `https://pricing.wave.online/${created.slug}`;
 */
export class PricingAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/pricing/manifests";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /** POST /v1/pricing/manifests — validate + upsert a manifest (pricing:write). */
  async createManifest(request: PricingManifest): Promise<ManifestCreateResult> {
    return this.client.post<ManifestCreateResult>(this.basePath, request);
  }

  /** GET /v1/pricing/manifests — list the caller org's manifests (pricing:read). */
  async listManifests(): Promise<ManifestList> {
    return this.client.get<ManifestList>(this.basePath);
  }

  /** GET /v1/pricing/manifests/:slug — read one manifest (pricing:read). */
  async getManifest(slug: string): Promise<ManifestRead> {
    return this.client.get<ManifestRead>(`${this.basePath}/${encodeURIComponent(slug)}`);
  }
}

export function createPricingAPI(client: WaveClient): PricingAPI {
  return new PricingAPI(client);
}
