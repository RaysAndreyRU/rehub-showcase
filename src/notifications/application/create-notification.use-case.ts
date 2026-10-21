import type {
  CreateNotificationInput,
  NotificationCreationResult
} from '../domain/notification.types.js'
import type { NotificationRepositoryPort } from '../ports/notification-repository.port.js'
import type {
  DeliveryFailureReporterPort,
  RealtimeNotificationPort
} from '../ports/realtime-notification.port.js'

export type Clock = {
  now(): Date
}

export class CreateNotification {
  constructor(
    private readonly repository: NotificationRepositoryPort,
    private readonly realtime: RealtimeNotificationPort,
    private readonly failures: DeliveryFailureReporterPort,
    private readonly clock: Clock
  ) {}

  async execute(input: CreateNotificationInput): Promise<NotificationCreationResult> {
    const notification = await this.repository.create({
      ...input,
      createdAt: this.clock.now()
    })

    try {
      await this.realtime.deliver(input.userId, notification)
      return { notification, realtime: 'DELIVERED' }
    } catch (error: unknown) {
      this.failures.capture({
        notificationId: notification.id,
        userId: input.userId,
        error
      })
      return { notification, realtime: 'DEFERRED' }
    }
  }
}
