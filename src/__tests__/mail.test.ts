/**
 * MailAPI Tests — E5 comms productization SDK surface.
 *
 * Verifies the SDK forwards the wave-mail-edge / gateway-proxied routes:
 *   POST /v1/mail/send
 *   POST /v1/mail/reply/:messageId
 *   GET  /v1/mail/search
 *   POST /v1/transcripts/email
 *   POST /v1/sms/send
 */

import { describe, it, expect, vi } from "vitest";
import { MailAPI, createMailAPI } from "../mail";
import type { WaveClient } from "../client";

function mockClient() {
  const post = vi.fn();
  const get = vi.fn();
  const client = { post, get } as unknown as WaveClient;
  return { client, post, get };
}

describe("MailAPI", () => {
  it("is constructable directly and via factory", () => {
    const { client } = mockClient();
    expect(new MailAPI(client)).toBeInstanceOf(MailAPI);
    expect(createMailAPI(client)).toBeInstanceOf(MailAPI);
  });

  it("send() POSTs to /v1/mail/send and returns SendResult", async () => {
    const { client, post } = mockClient();
    const result = { messageId: "msg_abc", status: "queued" as const };
    post.mockResolvedValue(result);
    const api = new MailAPI(client);

    const res = await api.send({
      to: "alice@example.com",
      subject: "Hello",
      text: "Hi there",
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/v1/mail/send", {
      to: "alice@example.com",
      subject: "Hello",
      text: "Hi there",
    });
    expect(res.messageId).toBe("msg_abc");
    expect(res.status).toBe("queued");
  });

  it("reply() POSTs to /v1/mail/reply/:messageId", async () => {
    const { client, post } = mockClient();
    const result = { status: "sent" as const };
    post.mockResolvedValue(result);
    const api = new MailAPI(client);

    const res = await api.reply("msg_xyz", { text: "Reply body", replyAll: true });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/v1/mail/reply/msg_xyz", {
      text: "Reply body",
      replyAll: true,
    });
    expect(res.status).toBe("sent");
  });

  it("search() GETs /v1/mail/search with query param", async () => {
    const { client, get } = mockClient();
    const result = { threads: [{ id: "t1" }] };
    get.mockResolvedValue(result);
    const api = new MailAPI(client);

    const res = await api.search("invoice");

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/v1/mail/search", { params: { q: "invoice" } });
    expect(res.threads).toHaveLength(1);
  });

  it("transcriptEmail() POSTs to /v1/transcripts/email", async () => {
    const { client, post } = mockClient();
    const result = { status: "queued" as const };
    post.mockResolvedValue(result);
    const api = new MailAPI(client);

    const res = await api.transcriptEmail({
      to: "bob@example.com",
      transcript: "Full transcript text",
      title: "Meeting Notes",
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/v1/transcripts/email", {
      to: "bob@example.com",
      transcript: "Full transcript text",
      title: "Meeting Notes",
    });
    expect(res.status).toBe("queued");
  });

  it("sms() POSTs to /v1/sms/send", async () => {
    const { client, post } = mockClient();
    const result = { sid: "SM123", status: "queued" };
    post.mockResolvedValue(result);
    const api = new MailAPI(client);

    const res = await api.sms({ to: "+15551234567", body: "Your code is 42" });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/v1/sms/send", {
      to: "+15551234567",
      body: "Your code is 42",
    });
    expect(res.sid).toBe("SM123");
    expect(res.status).toBe("queued");
  });
});
