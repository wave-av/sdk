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

// src/phone.ts
var phone_exports = {};
__export(phone_exports, {
  PhoneAPI: () => PhoneAPI,
  createPhoneAPI: () => createPhoneAPI
});
module.exports = __toCommonJS(phone_exports);
var PhoneAPI = class {
  client;
  basePath = "/v1/phone";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Phone Numbers
  // ==========================================================================
  /**
   * List owned phone numbers
   *
   * Requires: phone:read permission
   */
  async listNumbers(params) {
    return this.client.get(
      `${this.basePath}/numbers`,
      { params }
    );
  }
  /**
   * Get a phone number by ID
   *
   * Requires: phone:read permission
   */
  async getNumber(numberId) {
    return this.client.get(`${this.basePath}/numbers/${numberId}`);
  }
  /**
   * Search for available phone numbers to purchase
   *
   * Requires: phone:read permission
   */
  async searchAvailableNumbers(request) {
    return this.client.post(
      `${this.basePath}/numbers/available`,
      request
    );
  }
  /**
   * Purchase a phone number
   *
   * Requires: phone:purchase permission
   */
  async purchaseNumber(number, options) {
    return this.client.post(`${this.basePath}/numbers/purchase`, {
      number,
      ...options
    });
  }
  /**
   * Update a phone number
   *
   * Requires: phone:update permission
   */
  async updateNumber(numberId, updates) {
    return this.client.patch(
      `${this.basePath}/numbers/${numberId}`,
      updates
    );
  }
  /**
   * Release a phone number
   *
   * Requires: phone:release permission (server-side RBAC enforced)
   */
  async releaseNumber(numberId) {
    await this.client.delete(
      `${this.basePath}/numbers/${numberId}`,
      { method: "DELETE" }
    );
  }
  // ==========================================================================
  // Calls
  // ==========================================================================
  /**
   * Make an outbound call
   *
   * Requires: phone:call permission
   */
  async makeCall(request) {
    return this.client.post(`${this.basePath}/calls`, request);
  }
  /**
   * Get a call by ID
   *
   * Requires: phone:read permission
   */
  async getCall(callId) {
    return this.client.get(`${this.basePath}/calls/${callId}`);
  }
  /**
   * List calls
   *
   * Requires: phone:read permission
   */
  async listCalls(params) {
    return this.client.get(
      `${this.basePath}/calls`,
      { params }
    );
  }
  /**
   * Update an active call
   *
   * Requires: phone:call permission
   */
  async updateCall(callId, updates) {
    return this.client.patch(`${this.basePath}/calls/${callId}`, updates);
  }
  /**
   * End an active call
   *
   * Requires: phone:call permission
   */
  async endCall(callId) {
    return this.updateCall(callId, { status: "completed" });
  }
  /**
   * Get call recording
   *
   * Requires: phone:read permission
   */
  async getRecording(callId) {
    return this.client.get(`${this.basePath}/calls/${callId}/recording`);
  }
  /**
   * Wait for call to end
   */
  async waitForCallEnd(callId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 36e5;
    const startTime = Date.now();
    const terminalStatuses = [
      "completed",
      "failed",
      "busy",
      "no_answer",
      "canceled"
    ];
    while (Date.now() - startTime < timeout) {
      const call = await this.getCall(callId);
      if (options?.onUpdate) {
        options.onUpdate(call);
      }
      if (terminalStatuses.includes(call.status)) {
        return call;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Call wait timed out after ${timeout}ms`);
  }
  // ==========================================================================
  // Conferences
  // ==========================================================================
  /**
   * Create a conference room
   *
   * Requires: phone:conference permission
   */
  async createConference(options) {
    return this.client.post(`${this.basePath}/conferences`, options);
  }
  /**
   * Get a conference by ID
   *
   * Requires: phone:read permission
   */
  async getConference(conferenceId) {
    return this.client.get(
      `${this.basePath}/conferences/${conferenceId}`
    );
  }
  /**
   * List conferences
   *
   * Requires: phone:read permission
   */
  async listConferences(params) {
    return this.client.get(
      `${this.basePath}/conferences`,
      { params }
    );
  }
  /**
   * Add a participant to a conference
   *
   * Requires: phone:conference permission
   */
  async addConferenceParticipant(conferenceId, options) {
    return this.client.post(
      `${this.basePath}/conferences/${conferenceId}/participants`,
      options
    );
  }
  /**
   * Update a conference participant
   *
   * Requires: phone:conference permission
   */
  async updateConferenceParticipant(conferenceId, callId, updates) {
    return this.client.patch(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      updates
    );
  }
  /**
   * Remove a participant from a conference
   *
   * Requires: phone:conference permission (server-side RBAC enforced)
   */
  async removeConferenceParticipant(conferenceId, callId) {
    await this.client.delete(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      { method: "DELETE" }
    );
  }
  /**
   * End a conference
   *
   * Requires: phone:conference permission
   */
  async endConference(conferenceId) {
    return this.client.post(
      `${this.basePath}/conferences/${conferenceId}/end`
    );
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Validate a phone number
   *
   * Requires: phone:read permission
   */
  async validateNumber(number) {
    return this.client.post(`${this.basePath}/validate`, { number });
  }
  /**
   * Get supported countries
   *
   * Requires: phone:read permission
   */
  async getSupportedCountries() {
    return this.client.get(`${this.basePath}/countries`);
  }
};
function createPhoneAPI(client) {
  return new PhoneAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PhoneAPI,
  createPhoneAPI
});
