---
name: wave-products
description: Discover and call every WAVE product surface from one catalog-driven client. Use when an agent needs to find what WAVE products exist (captions, transcribe, phone, MoQ, …), resolve a product's surface URL, or make a generic call to a product without a bespoke client.
---

# wave-products

Every WAVE product surface (the ~30 spokes + core) is ONE contract — a URL that reverse-proxies to
`api.wave.online` behind the gateway, sharing one WAVE key. So ONE client serves them all; the
CATALOG is the data, not 30 bespoke clients.

## The catalog

`@wave-av/sdk` `listProducts()` / `CATALOG` — 31 products, each `{ id, name, phase, surface }`.
Phase is `ga | preview | planned | scaffolded`; it is **descriptive, not enforced** — a `planned`
product 404s at the edge, which is the honest answer.

## Use

- **Discover**: `wave products` (CLI) · `wave_products` (MCP) · `listProducts()` (SDK) — the full list.
- **Call**: `new ProductClient({ productId: "captions", token }).call("/v1/transcribe", { body })` (SDK) ·
  `wave product captions /v1/transcribe` (CLI). The bearer is the shared WAVE key; the gateway enforces
  scope/entitlement/meter — the client never re-implements auth.

## When to use

- Any time an agent needs to reach a product surface it doesn't have a bespoke client for — resolve the
  id from the catalog and call it, rather than guessing a URL or hand-rolling a fetch.
- NEVER guess a hostname. The catalog is the SSOT; an id not in the catalog is not a product.
