"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/mail.ts
var mail_exports = {};
__export(mail_exports, {
  MailAPI: () => MailAPI,
  createMailAPI: () => createMailAPI
});
module.exports = __toCommonJS(mail_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailAPI,
  createMailAPI
});
