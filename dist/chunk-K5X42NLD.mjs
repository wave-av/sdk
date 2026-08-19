// src/notifications.ts
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

export {
  NotificationsAPI,
  createNotificationsAPI
};
