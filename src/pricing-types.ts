/**
 * WAVE SDK - Pricing Pages types.
 *
 * The tier-manifest registry (pricing-pages E0) and the hosted-page renderer (E1).
 * Shapes mirror the gateway's pricing-manifests module; the rail law (sub-$0.50
 * must be x402; card only at or above $0.50) is enforced server-side.
 */

/** One seller tier in a manifest. `price_usdc_micro` is an integer micro-USDC string. */
export interface PricingTier {
  id: string;
  name: string;
  price_usdc_micro: string;
  rail: "x402" | "card" | "both";
  billing: "per_op" | "monthly_cap" | "volume";
  features: string[];
}

/** A seller's tier manifest (the registry row's manifest payload). */
export interface PricingManifest {
  slug: string;
  title: string;
  tiers: PricingTier[];
  contact?: string;
  payout?: string;
}

/** POST /v1/pricing/manifests response. */
export interface ManifestCreateResult {
  slug: string;
  org: string;
  status: "published" | "draft" | "suspended";
  updated_at: string;
}

/** GET /v1/pricing/manifests list entry. */
export interface ManifestListEntry {
  slug: string;
  title: string;
  status: string;
  updated_at: string;
}

/** GET /v1/pricing/manifests response. */
export interface ManifestList {
  org: string;
  manifests: ManifestListEntry[];
}

/** GET /v1/pricing/manifests/:slug response. */
export interface ManifestRead {
  org: string;
  slug: string;
  status: string;
  updated_at: string;
  manifest: PricingManifest;
}
