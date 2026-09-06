import { stripTrailingSlashes } from './url-util';
/**
 * WAVE Custody client — the SDK rung for capability custody.
 *
 * Wraps the capability-custody surface (the gateway's CapabilityAccount DO): grant/revoke/inspect/
 * exercise. An agent exercises an opaque, revocable capability — never a raw token. The exercise
 * path runs grant → egress fence → in-memory decrypt → outbound call → sanitized receipt; the SDK
 * never sees the token, only the receipt. Auth = a service bearer (the caller's WAVE key).
 */

export type GrantStatus = "active" | "revoked" | "expired" | "crypto_shredded";

export interface CapabilityGrant {
  grantId: string;
  granteeDid: string;
  subjectUserId: string;
  resourceProvider: string;
  resourceInstance: string;
  allowedActions: string[];
  expiresAt: string;
  status: GrantStatus;
}

export interface ExerciseRequest {
  grantId: string;
  action: string;
  resourceInstance: string;
  targetUrl: string;
}

export interface ExerciseReceipt {
  grantId: string;
  action: string;
  resourceInstance: string;
  status: number;
  body: unknown;
}

export interface CustodyClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export class CustodyClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: CustodyClientOptions) {
    this.baseUrl = stripTrailingSlashes(opts.baseUrl);
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`custody: upstream ${res.status}`);
    return (await res.json()) as T;
  }

  /** Grant a capability (returns the grant). */
  grant(input: Omit<CapabilityGrant, "grantId" | "status">): Promise<CapabilityGrant> {
    return this.post<CapabilityGrant>("/v1/custody/grant", input);
  }

  /** Revoke a grant (provably effective — a later exercise fails GRANT_REVOKED). */
  revoke(input: { grantId: string; revocationId: string }): Promise<{ grantId: string; status: GrantStatus }> {
    return this.post("/v1/custody/revoke", input);
  }

  /** Inspect a grant (metadata only — never a secret). */
  inspect(input: { grantId: string }): Promise<CapabilityGrant> {
    return this.post("/v1/custody/inspect", input);
  }

  /** Exercise a capability — the receipt is name-only; the token never crosses the SDK. */
  exercise(input: ExerciseRequest): Promise<ExerciseReceipt> {
    return this.post<ExerciseReceipt>("/v1/custody/exercise", input);
  }
}
