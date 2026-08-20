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

// src/notifications.ts
var notifications_exports = {};
__export(notifications_exports, {
  NotificationsAPI: () => NotificationsAPI,
  createNotificationsAPI: () => createNotificationsAPI
});
module.exports = __toCommonJS(notifications_exports);
var NotificationsAPI = class {
  client;
  basePath = "/v1/notifications";
  constructor(client) {
    this.client = client;
  }
  /** List notifications with optional filters. */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  /** Get a single notification by ID. */
  async get(notificationId) {
    return this.client.get(`${this.basePath}/${notificationId}`);
  }
  /** Mark a notification as read. */
  async markAsRead(notificationId) {
    return this.client.post(`${this.basePath}/${notificationId}/read`);
  }
  /** Mark all notifications as read. */
  async markAllRead() {
    return this.client.post(`${this.basePath}/mark-all-read`);
  }
  /** Archive a notification. */
  async archive(notificationId) {
    return this.client.post(`${this.basePath}/${notificationId}/archive`);
  }
  /** Delete a notification. */
  async remove(notificationId) {
    await this.client.delete(`${this.basePath}/${notificationId}`);
  }
  /** Get unread count. */
  async getUnreadCount() {
    return this.client.get(`${this.basePath}/unread-count`);
  }
  /** Get notification preferences. */
  async getPreferences() {
    return this.client.get(`${this.basePath}/preferences`);
  }
  /** Update notification preferences. */
  async updatePreferences(preferences) {
    return this.client.patch(`${this.basePath}/preferences`, preferences);
  }
};
function createNotificationsAPI(client) {
  return new NotificationsAPI(client);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotificationsAPI,
  createNotificationsAPI
});
