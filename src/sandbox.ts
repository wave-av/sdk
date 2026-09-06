/**
 * WAVE SDK - Sandbox API
 *
 * Safe, contained command execution: preview a command's effect (no side effects,
 * no metering beyond the preview call itself), approve it, then apply it for real —
 * or escalate to a real disposable container for untrusted/needs-network work.
 *
 * Flow: `preview()` returns a receipt (a content-addressed digest of the exact
 * command + files). Pass that receipt's `id` back as `approval` to `apply()` — the
 * server rejects any approval that does not match the previewed diff byte-for-byte,
 * so a caller cannot approve one command and run a different one. `receipt()` looks
 * up a previously-issued receipt by id.
 *
 * NOTE: This is a client SDK. All authorization/scope/entitlement checks are
 * performed server-side. The API returns 403 (SCOPE_INSUFFICIENT) if the
 * authenticated key lacks `sandbox:write`, and 402 (x402 payment-required) for an
 * unauthenticated caller.
 */

import type { WaveClient } from './client';

// ============================================================================
// Types
// ============================================================================

/** Containment tier a command ran (or would run) under. */
export type SandboxTier = 'edge' | 'node' | 'escalate';

/** Containment classification reported on an applied receipt. */
export type SandboxContainment = 'tier-0' | 'tier-1';

/** A single filesystem-diff entry from a preview or apply call. */
export interface SandboxFsDiffEntry {
  path: string;
  op: 'create' | 'modify' | 'delete' | string;
  [key: string]: unknown;
}

/** A file to seed into the sandbox's in-memory (or, tier-1, real) filesystem. */
export interface SandboxFileInput {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

/** The content-addressed, per-tenant-namespaced execution receipt. */
export interface SandboxReceipt {
  /** 8-hex-char digest identifying this exact command+files+options combination. */
  id: string;
  tier?: SandboxTier;
  containment?: SandboxContainment;
  commandHash?: string;
  /** Metered vCPU-seconds consumed applying this receipt (tier-1 escalation only). */
  vcpuSeconds?: number;
  applied?: boolean;
  [key: string]: unknown;
}

/** Request shared by preview() and apply(). */
export interface SandboxCommandRequest {
  /** The shell command to run inside the contained sandbox. */
  command: string;
  /** Optional files to seed into the sandbox filesystem before running. */
  files?: SandboxFileInput[];
  /** Reserved for future streaming/incremental-output support. */
  watch?: boolean;
}

/** Response from `POST /v1/sandbox/preview`. */
export interface SandboxPreviewResult {
  tier: SandboxTier;
  /** What the command WOULD execute as, without side effects. */
  wouldExec: string;
  fsDiff: SandboxFsDiffEntry[];
  receipt: SandboxReceipt;
}

/** Request for `POST /v1/sandbox/apply` — same fields as preview, plus the approval token. */
export interface SandboxApplyRequest extends SandboxCommandRequest {
  /** The `receipt.id` returned by a prior `preview()` call for this exact command+files. */
  approval: string;
}

/** Response from `POST /v1/sandbox/apply`. */
export interface SandboxApplyResult {
  approved: true;
  tier: SandboxTier;
  containment?: SandboxContainment;
  exitCode: number | null;
  stdout: string;
  truncated: boolean;
  fsDiff: SandboxFsDiffEntry[];
  receipt: SandboxReceipt;
}

/** Response from `GET /v1/sandbox/receipt/{id}`. */
export interface SandboxReceiptResult {
  receipt: SandboxReceipt;
}

// ============================================================================
// Sandbox API
// ============================================================================

/**
 * Sandbox API client — safe execution front door (preview → approve → apply).
 *
 * Requires the `sandbox:write` scope on the API key for `preview`/`apply` (POST),
 * and `sandbox:read` for `receipt` (GET). Neither scope is granted by default —
 * see https://gateway.wave.online/.well-known/wave-scopes.json.
 *
 * @example
 * ```typescript
 * import { Wave } from '@wave-av/sdk';
 *
 * const wave = new Wave({ apiKey: process.env.WAVE_API_KEY! });
 *
 * const preview = await wave.sandbox.preview({ command: 'echo hi && node --version' });
 * const result = await wave.sandbox.apply({
 *   command: 'echo hi && node --version',
 *   approval: preview.receipt.id,
 * });
 * console.log(result.stdout);
 *
 * const fetched = await wave.sandbox.receipt(result.receipt.id);
 * ```
 */
export class SandboxAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/sandbox';

  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Preview a command: runs it in the contained sandbox (in-memory FS, network
   * off) and returns the would-be diff plus a receipt to approve, WITHOUT
   * committing any side effects.
   *
   * Requires: sandbox:write scope.
   */
  async preview(request: SandboxCommandRequest): Promise<SandboxPreviewResult> {
    return this.client.post<SandboxPreviewResult>(`${this.basePath}/preview`, request);
  }

  /**
   * Apply a previously-previewed command. `approval` must be the `receipt.id`
   * from a `preview()` call for this EXACT command + files — the server
   * fail-closes (403 `approval_rejected`) on any mismatch or forged token.
   *
   * Requires: sandbox:write scope.
   */
  async apply(request: SandboxApplyRequest): Promise<SandboxApplyResult> {
    return this.client.post<SandboxApplyResult>(`${this.basePath}/apply`, request);
  }

  /**
   * Fetch a previously-issued receipt by id (hash-only, per-tenant namespaced,
   * TTL-bound — a 404 means it expired or was never issued for this key).
   *
   * Requires: sandbox:read scope.
   */
  async receipt(receiptId: string): Promise<SandboxReceiptResult> {
    return this.client.get<SandboxReceiptResult>(`${this.basePath}/receipt/${receiptId}`);
  }

  /**
   * Convenience: preview then immediately apply the same command with the
   * receipt's own id as the approval token. Equivalent to calling `preview()`
   * followed by `apply()` by hand.
   */
  async run(request: SandboxCommandRequest): Promise<SandboxApplyResult> {
    const preview = await this.preview(request);
    return this.apply({ ...request, approval: preview.receipt.id });
  }
}

/**
 * Create a Sandbox API instance
 */
export function createSandboxAPI(client: WaveClient): SandboxAPI {
  return new SandboxAPI(client);
}
