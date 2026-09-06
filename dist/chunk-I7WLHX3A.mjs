// src/mail.ts
var MailAPI = class {
  client;
  basePath = "/v1";
  constructor(client) {
    this.client = client;
  }
  /**
   * Send an email.
   *
   * Sub-cent sends are x402-USDC-settled; without a settled receipt the server
   * returns 402.
   */
  async send(request) {
    return this.client.post(`${this.basePath}/mail/send`, request);
  }
  /** Reply to an existing message by its `messageId`. */
  async reply(messageId, body) {
    return this.client.post(
      `${this.basePath}/mail/reply/${messageId}`,
      body
    );
  }
  /** Full-text search across mail threads. */
  async search(q) {
    return this.client.get(`${this.basePath}/mail/search`, {
      params: { q }
    });
  }
  /** Send a transcript email (the E1 comms productization surface). */
  async transcriptEmail(request) {
    return this.client.post(
      `${this.basePath}/transcripts/email`,
      request
    );
  }
  /** Send an SMS message. */
  async sms(request) {
    return this.client.post(`${this.basePath}/sms/send`, request);
  }
};
function createMailAPI(client) {
  return new MailAPI(client);
}

export {
  MailAPI,
  createMailAPI
};
