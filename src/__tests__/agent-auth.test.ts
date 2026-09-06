import { describe, expect, it, vi } from "vitest";
import {
  startAgentCeremony,
  pollAgentCeremony,
  refreshAgentCeremony,
  isCeremonyPending,
  isCeremonyTerminal,
} from "../agent-auth";

const okJson = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

const GRANT = {
  device_code: "a3f8c2e1d4b7",
  user_code: "ABCD-1234",
  verification_uri: "https://api.wave.online/agent/auth/verify",
  verification_uri_complete: "https://api.wave.online/agent/auth/verify?user_code=ABCD-1234",
  expires_in: 600,
  interval: 5,
};

describe("startAgentCeremony", () => {
  it("POSTs the empty body to the device route (no credential, by design)", async () => {
    const fetchMock = okJson(GRANT);
    const grant = await startAgentCeremony({ fetchImpl: fetchMock as unknown as typeof fetch });
    expect(grant.device_code).toBe("a3f8c2e1d4b7");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.wave.online/v1/agent/auth/device");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({});
    // no authorization header: the ceremony is the pre-credential path
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("surfaces the honest dashboard-off 403", async () => {
    const fetchMock = okJson({ error: "Device authorization is not enabled for this app" }, 403);
    await expect(startAgentCeremony({ fetchImpl: fetchMock as unknown as typeof fetch })).rejects.toThrow(
      "Device authorization is not enabled",
    );
  });
});

describe("pollAgentCeremony", () => {
  it("sends the REGISTERED RFC 8628 URN (the gateway accepts the shorthand too, but the URN is canonical)", async () => {
    const fetchMock = okJson({ access_token: "at", token_type: "Bearer", expires_in: 899, refresh_token: "rt" });
    await pollAgentCeremony("a3f8c2e1d4b7", { fetchImpl: fetchMock as unknown as typeof fetch });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: "a3f8c2e1d4b7",
    });
  });

  it("passes the polling protocol through verbatim (authorization_pending classifies as pending)", async () => {
    const fetchMock = okJson({ error: "authorization_pending" }, 400);
    const err = await pollAgentCeremony("x", { fetchImpl: fetchMock as unknown as typeof fetch }).catch((e) => e);
    expect(isCeremonyPending(err)).toBe(true);
    expect(isCeremonyTerminal(err)).toBe(false);
  });

  it("expired_token / access_denied classify as terminal", () => {
    const mk = (code: string) => Object.assign(new Error(code), { code });
    expect(isCeremonyTerminal(mk("expired_token"))).toBe(true);
    expect(isCeremonyTerminal(mk("access_denied"))).toBe(true);
    expect(isCeremonyPending(mk("expired_token"))).toBe(false);
  });
});

describe("refreshAgentCeremony", () => {
  it("sends the refresh grant with its own field (rotation semantics)", async () => {
    const fetchMock = okJson({ access_token: "at2", token_type: "Bearer", expires_in: 899, refresh_token: "rt2" });
    const out = await refreshAgentCeremony("rt", { fetchImpl: fetchMock as unknown as typeof fetch });
    expect(out.refresh_token).toBe("rt2");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ grant_type: "refresh_token", refresh_token: "rt" });
  });
});
