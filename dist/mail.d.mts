import { WaveClient } from './client.mjs';
import { MailSendRequest, SendResult, MailReplyBody, MailSearchResult, TranscriptEmailRequest, SmsRequest, SmsResult } from './mail-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';
import './client-types.mjs';

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
declare class MailAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Send an email.
     *
     * Sub-cent sends are x402-USDC-settled; without a settled receipt the server
     * returns 402.
     */
    send(request: MailSendRequest): Promise<SendResult>;
    /** Reply to an existing message by its `messageId`. */
    reply(messageId: string, body: MailReplyBody): Promise<SendResult>;
    /** Full-text search across mail threads. */
    search(q: string): Promise<MailSearchResult>;
    /** Send a transcript email (the E1 comms productization surface). */
    transcriptEmail(request: TranscriptEmailRequest): Promise<SendResult>;
    /** Send an SMS message. */
    sms(request: SmsRequest): Promise<SmsResult>;
}
declare function createMailAPI(client: WaveClient): MailAPI;

export { MailAPI, MailReplyBody, MailSearchResult, MailSendRequest, SendResult, SmsRequest, SmsResult, TranscriptEmailRequest, createMailAPI };
