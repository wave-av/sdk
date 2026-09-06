---
name: wave-custody
description: Manage WAVE capability grants — grant/revoke/inspect an agent's scoped, revocable, time-bounded access to a third-party account WITHOUT handing it the token. Use when an agent needs to act on GitHub (or another account) and the credential must never leave custody.
---

# wave-custody

An agent exercises an opaque, revocable capability — never a raw token. The gateway's `CapabilityAccount` DO holds ciphertext-only credentials; the exercise path is grant → egress fence → in-memory decrypt → call → sanitized receipt.

## Concepts
- A **grant** is per-user, per-resource-instance (e.g. `acme/api`), with `allowedActions`, a hard `expiresAt`, and a `revocationId`. Least-privilege + revocable + time-bounded.
- **Exercise** = check grant (active / not-expired / instance / action) → egress fence (exact-match allowlist) → decrypt token in-memory → outbound call (token only in Authorization header) → name-only receipt.
- **Crypto-shred** destroys the wrapped DEK → ciphertext unrecoverable → `TOKEN_UNRECOVERABLE`.

## Use
- `grant` / `revoke` / `inspect` / `exercise` against the capability DO.
- The `TOKEN_UNRECOVERABLE` error is stable and expected after shred — never retry in a way that emits the token.

## When to use
- Any time an agent needs to write to GitHub (comment, issue, PR) without holding a token. Always prefer a scoped grant over a raw credential.
