/**
 * SandboxAPI Tests — safe contained command execution (preview -> approve -> apply).
 *
 * Verifies the SDK forwards the sandbox front-door routes:
 *   POST /v1/sandbox/preview
 *   POST /v1/sandbox/apply
 *   GET  /v1/sandbox/receipt/{id}
 */

import { describe, it, expect, vi } from "vitest";
import { SandboxAPI, createSandboxAPI } from "../sandbox";
import type { WaveClient } from "../client";

function mockClient() {
  const get = vi.fn();
  const post = vi.fn();
  const client = { get, post } as unknown as WaveClient;
  return { client, get, post };
}

describe("SandboxAPI", () => {
  it("preview() posts to /v1/sandbox/preview and returns the receipt", async () => {
    const { client, post } = mockClient();
    post.mockResolvedValueOnce({
      tier: "edge",
      wouldExec: "echo hi",
      fsDiff: [],
      receipt: { id: "abcd1234", tier: "edge", containment: "tier-0" },
    });
    const sandbox = new SandboxAPI(client);

    const result = await sandbox.preview({ command: "echo hi" });

    expect(post).toHaveBeenCalledWith("/v1/sandbox/preview", { command: "echo hi" });
    expect(result.receipt.id).toBe("abcd1234");
    expect(result.tier).toBe("edge");
  });

  it("apply() posts the approval token to /v1/sandbox/apply", async () => {
    const { client, post } = mockClient();
    post.mockResolvedValueOnce({
      approved: true,
      tier: "edge",
      containment: "tier-0",
      exitCode: 0,
      stdout: "hi\n",
      truncated: false,
      fsDiff: [],
      receipt: { id: "abcd1234", applied: true },
    });
    const sandbox = new SandboxAPI(client);

    const result = await sandbox.apply({ command: "echo hi", approval: "abcd1234" });

    expect(post).toHaveBeenCalledWith("/v1/sandbox/apply", { command: "echo hi", approval: "abcd1234" });
    expect(result.approved).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.receipt.applied).toBe(true);
  });

  it("receipt() gets /v1/sandbox/receipt/{id}", async () => {
    const { client, get } = mockClient();
    get.mockResolvedValueOnce({ receipt: { id: "abcd1234", tier: "edge" } });
    const sandbox = new SandboxAPI(client);

    const result = await sandbox.receipt("abcd1234");

    expect(get).toHaveBeenCalledWith("/v1/sandbox/receipt/abcd1234");
    expect(result.receipt.id).toBe("abcd1234");
  });

  it("run() previews then applies with the receipt id as approval", async () => {
    const { client, post } = mockClient();
    post
      .mockResolvedValueOnce({
        tier: "edge",
        wouldExec: "echo hi",
        fsDiff: [],
        receipt: { id: "abcd1234" },
      })
      .mockResolvedValueOnce({
        approved: true,
        tier: "edge",
        exitCode: 0,
        stdout: "hi\n",
        truncated: false,
        fsDiff: [],
        receipt: { id: "abcd1234", applied: true },
      });
    const sandbox = new SandboxAPI(client);

    const result = await sandbox.run({ command: "echo hi" });

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenNthCalledWith(1, "/v1/sandbox/preview", { command: "echo hi" });
    expect(post).toHaveBeenNthCalledWith(2, "/v1/sandbox/apply", { command: "echo hi", approval: "abcd1234" });
    expect(result.approved).toBe(true);
  });

  it("propagates a scope-insufficient rejection from the client (missing sandbox:write)", async () => {
    const { client, post } = mockClient();
    const scopeError = Object.assign(new Error("requires scope: sandbox:write"), {
      code: "SCOPE_INSUFFICIENT",
      statusCode: 403,
    });
    post.mockRejectedValueOnce(scopeError);
    const sandbox = new SandboxAPI(client);

    await expect(sandbox.preview({ command: "echo hi" })).rejects.toMatchObject({ code: "SCOPE_INSUFFICIENT" });
  });

  it("createSandboxAPI() factory returns a SandboxAPI instance", () => {
    const { client } = mockClient();
    expect(createSandboxAPI(client)).toBeInstanceOf(SandboxAPI);
  });
});
