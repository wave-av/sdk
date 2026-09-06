/**
 * WAVE SDK - Mail API
 *
 * Agent-facing comms surface: send, reply, search, transcript-email, and SMS via
 * the wave-mail-edge / gateway-proxied routes.
 *
 * Sub-cent sends are x402-USDC-settled. Callers without a settled receipt will
 * receive a 402; the SDK surfaces this as a standard {@link WaveError}.
 *
 * NOTE: Auth, scope (`mail:write` for send/reply/sms, `mail:read` for search),
 * entitlement, rate limit, and metering are enforced server-side; the SDK only
 * forwards your API key.
 */

import type { WaveClient } from "./client";
import type {
  MailSendRequest,
  MailReplyBody,
  MailSearchResult,
  TranscriptEmailRequest,
  SmsRequest,
  SmsResult,
  SendResult,
} from "./mail-types";

export type {
  MailSendRequest,
  MailReplyBody,
  MailSearchResult,
  TranscriptEmailRequest,
  SmsRequest,
  SmsResult,
  SendResult,
} from "./mail-types";

/**
 * Mail API — send, reply, search, transcript email, and SMS.
 *
 * @example
 * ```typescript
 * const result = await wave.mail.send({
 *   to: "alice@example.com",
 *   subject: "Your transcript",
 *   text: "See attached.",
 *   html: "<p>See attached.</p>",
 * });
 * console.log(result.status); // "queued" | "sent"
 * ```
 */
export class MailAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1";
  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Send an email.
   *
   * Sub-cent sends are x402-USDC-settled; without a settled receipt the server
   * returns 402.
   */
  async send(request: MailSendRequest): Promise<SendResult> {
    return this.client.post<SendResult>(`${this.basePath}/mail/send`, request);
  }

  /** Reply to an existing message by its `messageId`. */
  async reply(messageId: string, body: MailReplyBody): Promise<SendResult> {
    return this.client.post<SendResult>(
      `${this.basePath}/mail/reply/${messageId}`,
      body,
    );
  }

  /** Full-text search across mail threads. */
  async search(q: string): Promise<MailSearchResult> {
    return this.client.get<MailSearchResult>(`${this.basePath}/mail/search`, {
      params: { q },
    });
  }

  /** Send a transcript email (the E1 comms productization surface). */
  async transcriptEmail(request: TranscriptEmailRequest): Promise<SendResult> {
    return this.client.post<SendResult>(
      `${this.basePath}/transcripts/email`,
      request,
    );
  }

  /** Send an SMS message. */
  async sms(request: SmsRequest): Promise<SmsResult> {
    return this.client.post<SmsResult>(`${this.basePath}/sms/send`, request);
  }
}

export function createMailAPI(client: WaveClient): MailAPI {
  return new MailAPI(client);
}
