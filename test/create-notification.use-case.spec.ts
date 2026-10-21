import { describe, expect, it, vi } from 'vitest'
import { CreateNotification } from '../src/notifications/application/create-notification.use-case.js'
import {
  InMemoryDeliveryFailureReporter,
  InMemoryNotificationRepository,
  InMemoryRealtimeNotifications
} from '../src/notifications/adapters/in-memory-notification.adapters.js'
import type { NotificationRepositoryPort } from '../src/notifications/ports/notification-repository.port.js'

const clock = { now: () => new Date('2026-06-01T12:00:00.000Z') }
const input = {
  userId: 'admin-7',
  type: 'RED_FLAG_OPENED' as const,
  title: 'Patient requires attention',
  description: 'A high-severity rehabilitation signal was opened.'
}

describe('CreateNotification', () => {
  it('persists the notification before realtime delivery', async () => {
    const order: string[] = []
    const repository: NotificationRepositoryPort = {
      create: vi.fn(async (payload) => {
        order.push('persist')
        return { id: 'notification-1', ...payload, readAt: null }
      })
    }
    const realtime = {
      deliver: vi.fn(async () => {
        order.push('deliver')
      })
    }
    const failures = new InMemoryDeliveryFailureReporter()
    const useCase = new CreateNotification(repository, realtime, failures, clock)

    const result = await useCase.execute(input)

    expect(order).toEqual(['persist', 'deliver'])
    expect(result.realtime).toBe('DELIVERED')
    expect(failures.failures).toEqual([])
  })

  it('keeps the durable notification when realtime delivery fails', async () => {
    const repository = new InMemoryNotificationRepository()
    const realtime = new InMemoryRealtimeNotifications(false)
    const failures = new InMemoryDeliveryFailureReporter()
    const useCase = new CreateNotification(repository, realtime, failures, clock)

    const result = await useCase.execute(input)

    expect(result.realtime).toBe('DEFERRED')
    expect(repository.notifications).toEqual([result.notification])
    expect(realtime.deliveries).toEqual([])
    expect(failures.failures).toEqual([
      expect.objectContaining({
        notificationId: result.notification.id,
        userId: 'admin-7',
        error: expect.any(Error)
      })
    ])
  })

  it('does not attempt realtime delivery when persistence fails', async () => {
    const persistenceError = new Error('Database unavailable')
    const repository: NotificationRepositoryPort = {
      create: vi.fn(async () => Promise.reject(persistenceError))
    }
    const realtime = new InMemoryRealtimeNotifications()
    const failures = new InMemoryDeliveryFailureReporter()
    const useCase = new CreateNotification(repository, realtime, failures, clock)

    await expect(useCase.execute(input)).rejects.toBe(persistenceError)
    expect(realtime.deliveries).toEqual([])
    expect(failures.failures).toEqual([])
  })
})
