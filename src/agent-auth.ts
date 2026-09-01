/**
 * WAVE SDK - Agent Auth Ceremony (RFC 8628 Device Authorization)
 *
 * The pre-credential bootstrap: an agent with NO API key earns a wallet-access
 * grant through a person approval. The flow: request a device code, a person
 * approves at the verification URL (Google sign-in -> Approve), then poll for
 * tokens. Refresh rotates both tokens; a missing refresh_token on refresh means
 * the grant was revoked.
 *
 * These functions are STANDALONE (no apiKey): the ceremony exists precisely
 * because the caller has no credential yet. The polling 400s
 * (authorization_pending / slow_down / expired_token / access_denied) pass
 * through verbatim; they are the protocol, not failures to hide.
 */

/** POST /v1/agent/auth/device: the grant the ceremony starts with. */
export interface DeviceGrant {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

/** POST /v1/agent/auth/token (device grant): the tokens an approval yields. */
export interface CeremonyTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

/** POST /v1/agent/auth/token (refresh grant): rotated tokens. */
export interface RefreshedTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  /** Present on every refresh (rotation). Absent = the grant was revoked or expired. */
  refresh_token?: string;
}

/** The upstream polling protocol errors, passed through verbatim. */
export interface CeremonyPollError extends Error {
  /** authorization_pending | slow_down | expired_token | access_denied (as the upstream body carries it). */
  code?: string;
  status: number;
}

const DEFAULT_BASE = "https://api.wave.online";

export interface CeremonyOptions {
  /** Gateway base URL (default: https://api.wave.online). */
  baseUrl?: string;
  /** fetch implementation (tests inject a mock). */
  fetchImpl?: typeof fetch;
}

async function ceremonyPost<T>(url: string, body: unknown, fetchImpl: typeof fetch): Promise<T> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(
      (json as { error?: { message?: string } | string })?.error &&
      typeof (json as { error: { message?: string } }).error === "object"
        ? (json as { error: { message?: string } }).error.message
        : String((json as { error?: string }).error ?? text.slice(0, 200)),
    ) as CeremonyPollError;
    err.status = res.status;
    const e = json as { error?: string | { code?: string } };
    err.code = typeof e.error === "string" ? e.error : e.error?.code;
    throw err;
  }
  return json as T;
}

/**
 * Start the ceremony. Show the user_code + verification_uri_complete to a person;
 * they sign in and approve. Then poll with the device_code.
 * @example
 * const grant = await startAgentCeremony();
 * console.log(`approve at: ${grant.verification_uri_complete}`);
 */
export function startAgentCeremony(options: CeremonyOptions = {}): Promise<DeviceGrant> {
  const base = options.baseUrl ?? DEFAULT_BASE;
  const f = options.fetchImpl ?? fetch;
  return ceremonyPost<DeviceGrant>(`${base}/v1/agent/auth/device`, {}, f);
}

/**
 * Poll for tokens (grant_type: the registered RFC 8628 URN). While approval is
 * pending this REJECTS with authorization_pending (the protocol); keep polling at
 * the grant's interval. Use isCeremonyPending(err) to branch.
 */
export function pollAgentCeremony(deviceCode: string, options: CeremonyOptions = {}): Promise<CeremonyTokens> {
  const base = options.baseUrl ?? DEFAULT_BASE;
  const f = options.fetchImpl ?? fetch;
  return ceremonyPost<CeremonyTokens>(
    `${base}/v1/agent/auth/token`,
    { grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: deviceCode },
    f,
  );
}

/**
 * Refresh the access token (the old refresh token is invalidated; a replacement
 * returns in the same response). An absent refresh_token on the result means the
 * grant was revoked: restart the ceremony.
 */
export function refreshAgentCeremony(refreshToken: string, options: CeremonyOptions = {}): Promise<RefreshedTokens> {
  const base = options.baseUrl ?? DEFAULT_BASE;
  const f = options.fetchImpl ?? fetch;
  return ceremonyPost<RefreshedTokens>(
    `${base}/v1/agent/auth/token`,
    { grant_type: "refresh_token", refresh_token: refreshToken },
    f,
  );
}

/** True when a poll rejection is the keep-polling protocol state (pending or slow_down). */
export function isCeremonyPending(err: unknown): boolean {
  const e = err as CeremonyPollError;
  return Boolean(e && (e.code === "authorization_pending" || e.code === "slow_down"));
}

/** True when a poll rejection is terminal (expired_token or access_denied): restart the ceremony. */
export function isCeremonyTerminal(err: unknown): boolean {
  const e = err as CeremonyPollError;
  return Boolean(e && (e.code === "expired_token" || e.code === "access_denied"));
}
