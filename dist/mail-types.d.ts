/**
 * WAVE SDK - Mail Types
 *
 * Types for the mail API surface: send, reply, search, transcript email, and SMS.
 */
/** Result of a successful mail or SMS send operation. */
interface SendResult {
    /** Server-assigned message id (present when the edge accepts the envelope). */
    messageId?: string;
    /** Delivery status: `"queued"` if accepted into the outbound queue, `"sent"` if delivered synchronously. */
    status: "queued" | "sent";
    /** USDC amount settled via x402 for sub-cent sends (absent when no payment was required). */
    amountUsdc?: string;
}
/** Request body for {@link MailAPI.send}. */
interface MailSendRequest {
    /** Recipient email address. */
    to: string;
    /** Subject line. */
    subject: string;
    /** Plain-text body (at least one of `text` or `html` is recommended). */
    text?: string;
    /** HTML body. */
    html?: string;
    /** Inbox id to send from; defaults to the caller's primary inbox. */
    inboxId?: string;
}
/** Request body for {@link MailAPI.reply}. */
interface MailReplyBody {
    /** Plain-text reply body. */
    text?: string;
    /** HTML reply body. */
    html?: string;
    /** When true the reply is sent to all original recipients (Reply-All). */
    replyAll?: boolean;
}
/** Response shape from {@link MailAPI.search}. */
interface MailSearchResult {
    /** Matching threads ranked by relevance. */
    threads: unknown[];
}
/** Request body for {@link MailAPI.transcriptEmail}. */
interface TranscriptEmailRequest {
    /** Recipient email address. */
    to: string;
    /** Transcript text content. */
    transcript: string;
    /** Optional title / subject override. */
    title?: string;
}
/** Request body for {@link MailAPI.sms}. */
interface SmsRequest {
    /** E.164 phone number. */
    to: string;
    /** SMS message body. */
    body: string;
}
/** Response shape from {@link MailAPI.sms}. */
interface SmsResult {
    /** Twilio-style SID for the sent message. */
    sid: string;
    /** Delivery status (e.g. `"queued"`, `"sent"`). */
    status: string;
}

export type { MailReplyBody, MailSearchResult, MailSendRequest, SendResult, SmsRequest, SmsResult, TranscriptEmailRequest };
