import type { CreateNotificationInput, Notification } from '../domain/notification.types.js'

export interface NotificationRepositoryPort {
  create(input: CreateNotificationInput & { createdAt: Date }): Promise<Notification>
}
