/**
 * WAVE SDK - Notifications API
 *
 * User notification preferences, delivery channels, and notification management.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

export type NotificationChannel = "in_app" | "email" | "push" | "sms" | "slack" | "webhook";
export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification extends Timestamps {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  channel: NotificationChannel;
  action_url?: string;
  metadata?: Record<string, unknown>;
  read_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<string, { enabled: boolean; channels: NotificationChannel[] }>;
  quiet_hours?: { start: string; end: string; timezone: string };
  digest_frequency?: "realtime" | "hourly" | "daily" | "weekly";
}

export interface ListNotificationsParams extends PaginationParams {
  status?: NotificationStatus;
  type?: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  since?: string;
}

// ============================================================================
// Notifications API
// ============================================================================

/**
 * User notification management: preferences, channels, read state, and delivery.
 *
 * @example
 * ```typescript
 * const notifications = await wave.notifications.list({ status: 'unread' });
 * await wave.notifications.markAsRead(notifications.data[0].id);
 * await wave.notifications.markAllRead();
 * const prefs = await wave.notifications.getPreferences();
 * ```
 */
export class NotificationsAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/notifications";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /** List notifications with optional filters. */
  async list(params?: ListNotificationsParams): Promise<PaginatedResponse<Notification>> {
    return this.client.get<PaginatedResponse<Notification>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /** Get a single notification by ID. */
  async get(notificationId: string): Promise<Notification> {
    return this.client.get<Notification>(`${this.basePath}/${notificationId}`);
  }

  /** Mark a notification as read. */
  async markAsRead(notificationId: string): Promise<Notification> {
    return this.client.post<Notification>(`${this.basePath}/${notificationId}/read`);
  }

  /** Mark all notifications as read. */
  async markAllRead(): Promise<{ updated: number }> {
    return this.client.post<{ updated: number }>(`${this.basePath}/mark-all-read`);
  }

  /** Archive a notification. */
  async archive(notificationId: string): Promise<Notification> {
    return this.client.post<Notification>(`${this.basePath}/${notificationId}/archive`);
  }

  /** Delete a notification. */
  async remove(notificationId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${notificationId}`);
  }

  /** Get unread count. */
  async getUnreadCount(): Promise<{ count: number }> {
    return this.client.get<{ count: number }>(`${this.basePath}/unread-count`);
  }

  /** Get notification preferences. */
  async getPreferences(): Promise<NotificationPreferences> {
    return this.client.get<NotificationPreferences>(`${this.basePath}/preferences`);
  }

  /** Update notification preferences. */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    return this.client.patch<NotificationPreferences>(`${this.basePath}/preferences`, preferences);
  }
}

export function createNotificationsAPI(client: WaveClient): NotificationsAPI {
  return new NotificationsAPI(client);
}
