export type NotificationType =
  | 'REPORT_READY'
  | 'PATIENT_REQUEST_NEW'
  | 'RED_FLAG_OPENED'
  | 'SECURITY_EVENT'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  description: string
  createdAt: Date
  readAt: Date | null
}

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  description: string
}

export type NotificationCreationResult = {
  notification: Notification
  realtime: 'DELIVERED' | 'DEFERRED'
}
