import type {
  CreateNotificationInput,
  Notification
} from '../domain/notification.types.js'
import type { NotificationRepositoryPort } from '../ports/notification-repository.port.js'
import type {
  DeliveryFailureReporterPort,
  RealtimeNotificationPort
} from '../ports/realtime-notification.port.js'

export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  readonly notifications: Notification[] = []

  async create(input: CreateNotificationInput & { createdAt: Date }): Promise<Notification> {
    const notification: Notification = {
      id: `notification-${this.notifications.length + 1}`,
      ...input,
      readAt: null
    }
    this.notifications.push(notification)
    return notification
  }
}

export class InMemoryRealtimeNotifications implements RealtimeNotificationPort {
  readonly deliveries: Array<{ userId: string; notification: Notification }> = []

  constructor(private readonly available = true) {}

  async deliver(userId: string, notification: Notification): Promise<void> {
    if (!this.available) throw new Error('Realtime transport unavailable')
    this.deliveries.push({ userId, notification })
  }
}

export class InMemoryDeliveryFailureReporter implements DeliveryFailureReporterPort {
  readonly failures: Array<{ notificationId: string; userId: string; error: unknown }> = []

  capture(context: { notificationId: string; userId: string; error: unknown }): void {
    this.failures.push(context)
  }
}
