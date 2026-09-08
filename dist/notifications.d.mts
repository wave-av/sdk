import { WaveClient } from './client.mjs';
import { PaginationParams, PaginatedResponse, Timestamps } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Notifications API
 *
 * User notification preferences, delivery channels, and notification management.
 */

type NotificationChannel = "in_app" | "email" | "push" | "sms" | "slack" | "webhook";
type NotificationStatus = "unread" | "read" | "archived";
type NotificationPriority = "low" | "normal" | "high" | "urgent";
interface Notification extends Timestamps {
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
interface NotificationPreferences {
    user_id: string;
    channels: Record<NotificationChannel, boolean>;
    categories: Record<string, {
        enabled: boolean;
        channels: NotificationChannel[];
    }>;
    quiet_hours?: {
        start: string;
        end: string;
        timezone: string;
    };
    digest_frequency?: "realtime" | "hourly" | "daily" | "weekly";
}
interface ListNotificationsParams extends PaginationParams {
    status?: NotificationStatus;
    type?: string;
    priority?: NotificationPriority;
    channel?: NotificationChannel;
    since?: string;
}
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
declare class NotificationsAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /** List notifications with optional filters. */
    list(params?: ListNotificationsParams): Promise<PaginatedResponse<Notification>>;
    /** Get a single notification by ID. */
    get(notificationId: string): Promise<Notification>;
    /** Mark a notification as read. */
    markAsRead(notificationId: string): Promise<Notification>;
    /** Mark all notifications as read. */
    markAllRead(): Promise<{
        updated: number;
    }>;
    /** Archive a notification. */
    archive(notificationId: string): Promise<Notification>;
    /** Delete a notification. */
    remove(notificationId: string): Promise<void>;
    /** Get unread count. */
    getUnreadCount(): Promise<{
        count: number;
    }>;
    /** Get notification preferences. */
    getPreferences(): Promise<NotificationPreferences>;
    /** Update notification preferences. */
    updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
}
declare function createNotificationsAPI(client: WaveClient): NotificationsAPI;

export { type ListNotificationsParams, type Notification, type NotificationChannel, type NotificationPreferences, type NotificationPriority, type NotificationStatus, NotificationsAPI, createNotificationsAPI };
