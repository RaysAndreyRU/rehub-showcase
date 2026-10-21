import type { Notification } from '../domain/notification.types.js'

export interface RealtimeNotificationPort {
  deliver(userId: string, notification: Notification): Promise<void>
}

export interface DeliveryFailureReporterPort {
  capture(context: { notificationId: string; userId: string; error: unknown }): void
}
