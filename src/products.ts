/**
 * WAVE product catalog client — the catalog-driven SDK rung for EVERY product surface.
 *
 * The ~30 WAVE product surfaces (spokes + core) are all instantiations of one contract: a URL that
 * reverse-proxies to api.wave.online behind the gateway, sharing one WAVE key. So one client serves
 * them all — the CATALOG (id → surface) is the data, not 30 bespoke clients. This is the
 * "spoke-first, never from the apex" law: build the plane, plug the catalog in.
 *
 * Catalog source of truth: wave-av/wave-catalog `catalog/products.json` (vendored here so the SDK
 * resolves a product WITHOUT a runtime fetch; drift-gated against the live catalog in CI).
 */

export type ProductPhase = "ga" | "preview" | "planned" | "scaffolded";

export interface Product {
  id: string;
  name: string;
  phase: ProductPhase;
  surface: string;
}

/** The 31 WAVE products — vendored from wave-catalog/catalog/products.json. */
export const CATALOG: Product[] = [
  { id: "gateway", name: "WAVE Gateway", phase: "ga", surface: "https://api.wave.online" },
  { id: "docs", name: "Docs", phase: "ga", surface: "https://docs.wave.online" },
  { id: "www", name: "Marketing site", phase: "ga", surface: "https://wave.online" },
  { id: "blog", name: "Blog", phase: "ga", surface: "https://blog.wave.online" },
  { id: "changelog", name: "Changelog", phase: "ga", surface: "https://changelog.wave.online" },
  { id: "dispatch", name: "Dispatch (agent routing)", phase: "preview", surface: "https://api.wave.online/v1/dispatch" },
  { id: "moq", name: "MoQ streaming", phase: "preview", surface: "https://moq.wave.online" },
  { id: "srt", name: "SRT ingest", phase: "preview", surface: "https://srt.wave.online" },
  { id: "clip", name: "Clip", phase: "preview", surface: "https://api.wave.online/v1/clips" },
  { id: "bridge", name: "Conferencing bridge", phase: "preview", surface: "https://bridge.wave.online" },
  { id: "render", name: "Render (code-defined video)", phase: "planned", surface: "https://render.wave.online" },
  { id: "voice", name: "Voice (TTS)", phase: "preview", surface: "https://voice.wave.online" },
  { id: "transcribe", name: "Transcribe", phase: "preview", surface: "https://transcribe.wave.online" },
  { id: "captions", name: "Captions", phase: "preview", surface: "https://captions.wave.online" },
  { id: "search", name: "Search", phase: "preview", surface: "https://search.wave.online" },
  { id: "phone", name: "Phone", phase: "preview", surface: "https://phone.wave.online" },
  { id: "studio-ai", name: "Studio AI", phase: "planned", surface: "https://studio.wave.online" },
  { id: "sentiment", name: "Sentiment", phase: "preview", surface: "https://sentiment.wave.online" },
  { id: "podcast", name: "Podcast", phase: "preview", surface: "https://podcast.wave.online" },
  { id: "collab", name: "Collab", phase: "preview", surface: "https://collab.wave.online" },
  { id: "editor", name: "Editor", phase: "preview", surface: "https://editor.wave.online" },
  { id: "chapters", name: "Chapters", phase: "preview", surface: "https://chapters.wave.online" },
  { id: "pricing", name: "Pricing page", phase: "preview", surface: "https://pricing.wave.online" },
  { id: "trust", name: "Trust center", phase: "preview", surface: "https://trust.wave.online" },
  { id: "partners", name: "Partners", phase: "preview", surface: "https://partners.wave.online" },
  { id: "realtime", name: "Realtime SFU (WebRTC)", phase: "scaffolded", surface: "https://rt.wave.online" },
  { id: "ndi", name: "NDI native", phase: "scaffolded", surface: "https://ndi.wave.online" },
  { id: "rist", name: "RIST ingest", phase: "planned", surface: "https://rist.wave.online" },
  { id: "dante", name: "Dante WAN Bridge", phase: "planned", surface: "https://dante.wave.online" },
  { id: "omt", name: "OMT native", phase: "scaffolded", surface: "https://omt.wave.online" },
  { id: "media-engine", name: "Media Engine", phase: "scaffolded", surface: "https://media.wave.online" },
].map((product) => Object.freeze(product)) as Product[];

function copyProduct(product: Product): Product {
  return { ...product };
}

export interface ProductClientOptions {
  productId?: string;
  product?: Product;
  token?: string;
  fetchImpl?: typeof fetch;
}

export class ProductClient {
  readonly product: Product;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ProductClientOptions) {
    const product = opts.product ?? resolveProduct(opts.productId ?? "");
    if (!product) throw new Error(`products: unknown product "${opts.productId}"`);
    this.product = copyProduct(product);
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  /**
   * Generic call to the product's surface. `path` is relative to the product URL. The product's
   * phase is NOT enforced here (a `planned` product 404s at the edge, which is the honest answer).
   */
  async call<T>(path: string, opts: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}): Promise<T> {
    const method = opts.method ?? "POST";
      const res = await this.fetchImpl(
        `${this.product.surface.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
      {
          method,
      headers: this.headers(),
      ...(method !== "GET" && opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
    if (!res.ok) throw new Error(`${this.product.id}: upstream ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  get id(): string {
    return this.product.id;
  }

  get phase(): ProductPhase {
    return this.product.phase;
  }
}

/** The full catalog (a copy, so callers can't mutate the module constant). */
export function listProducts(): Product[] {
  return CATALOG.map(copyProduct);
}

/** Resolve a product id → product. Undefined for an unknown id. */
export function resolveProduct(id: string): Product | undefined {
  const product = CATALOG.find((p) => p.id === id);
  return product ? copyProduct(product) : undefined;
}
