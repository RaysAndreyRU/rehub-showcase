import { describe, expect, it } from 'vitest'
import { RecordLoginOutcome, type Clock } from '../src/login-security/application/record-login-outcome.use-case.js'
import { InMemoryLoginAttempts, InMemorySecurityAudit } from '../src/login-security/adapters/in-memory-security.adapters.js'

class MutableClock implements Clock {
  constructor(private value: Date) {}

  now(): Date {
    return new Date(this.value.getTime())
  }

  advance(milliseconds: number): void {
    this.value = new Date(this.value.getTime() + milliseconds)
  }
}

function setup() {
  const audit = new InMemorySecurityAudit()
  const attempts = new InMemoryLoginAttempts(3, 60_000, 300_000)
  const clock = new MutableClock(new Date('2026-06-01T10:00:00.000Z'))
  const useCase = new RecordLoginOutcome(audit, attempts, clock)
  return { audit, clock, useCase }
}

describe('RecordLoginOutcome', () => {
  it('writes an auditable event for a failed login', async () => {
    const { audit, useCase } = setup()

    const result = await useCase.execute({
      success: false,
      ip: '203.0.113.8',
      identifier: 'patient@example.test'
    })

    expect(result).toEqual({ accepted: false, temporarilyBlocked: false, failedAttempts: 1 })
    expect(audit.events).toEqual([
      expect.objectContaining({
        action: 'AUTH_LOGIN_FAILED',
        ip: '203.0.113.8',
        actor: null
      })
    ])
  })

  it('temporarily blocks an address after the configured threshold', async () => {
    const { useCase } = setup()
    const failure = { success: false, ip: '203.0.113.8', identifier: 'doctor@example.test' } as const

    await useCase.execute(failure)
    await useCase.execute(failure)
    const third = await useCase.execute(failure)

    expect(third.temporarilyBlocked).toBe(true)
    expect(third.failedAttempts).toBe(3)
    expect(await useCase.isAllowed(failure.ip)).toBe(false)
  })

  it('allows login again after the temporary block expires', async () => {
    const { clock, useCase } = setup()
    const failure = { success: false, ip: '203.0.113.8', identifier: 'admin@example.test' } as const

    await useCase.execute(failure)
    await useCase.execute(failure)
    await useCase.execute(failure)
    clock.advance(300_001)

    expect(await useCase.isAllowed(failure.ip)).toBe(true)
  })

  it('resets failed attempts and records the actor after a successful login', async () => {
    const { audit, useCase } = setup()
    await useCase.execute({ success: false, ip: '203.0.113.8', identifier: 'admin@example.test' })

    const result = await useCase.execute({
      success: true,
      ip: '203.0.113.8',
      identifier: 'admin@example.test',
      identity: { userId: '42', displayName: 'Demo Admin', role: 'ADMIN' }
    })

    expect(result).toEqual({ accepted: true, temporarilyBlocked: false, failedAttempts: 0 })
    expect(audit.events.at(-1)).toEqual(
      expect.objectContaining({
        action: 'AUTH_LOGIN_SUCCESS',
        actor: { userId: '42', displayName: 'Demo Admin', role: 'ADMIN' }
      })
    )
    expect(await useCase.isAllowed('203.0.113.8')).toBe(true)
  })
})
