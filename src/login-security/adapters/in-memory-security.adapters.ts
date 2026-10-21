import type { SecurityAuditEvent } from '../domain/login-security.types.js'
import type { FailureRegistration, LoginAttemptsPort } from '../ports/login-attempts.port.js'
import type { SecurityAuditPort } from '../ports/security-audit.port.js'

type AttemptState = {
  attempts: number
  attemptsExpireAt: number
  blockedUntil?: number
}

export class InMemorySecurityAudit implements SecurityAuditPort {
  readonly events: SecurityAuditEvent[] = []

  async append(event: SecurityAuditEvent): Promise<void> {
    this.events.push(event)
  }
}

export class InMemoryLoginAttempts implements LoginAttemptsPort {
  private readonly state = new Map<string, AttemptState>()

  constructor(
    private readonly threshold = 3,
    private readonly attemptsTtlMs = 60_000,
    private readonly blockTtlMs = 300_000
  ) {}

  async isBlocked(ip: string, now: Date): Promise<boolean> {
    const entry = this.current(ip, now.getTime())
    return entry?.blockedUntil !== undefined && entry.blockedUntil > now.getTime()
  }

  async registerFailure(ip: string, now: Date): Promise<FailureRegistration> {
    const timestamp = now.getTime()
    const current = this.current(ip, timestamp)
    const attempts = (current?.attempts ?? 0) + 1

    if (attempts >= this.threshold) {
      const blockedUntil = timestamp + this.blockTtlMs
      this.state.set(ip, {
        attempts,
        attemptsExpireAt: timestamp + this.attemptsTtlMs,
        blockedUntil
      })
      return { attempts, blocked: true, retryAt: new Date(blockedUntil) }
    }

    this.state.set(ip, {
      attempts,
      attemptsExpireAt: current?.attemptsExpireAt ?? timestamp + this.attemptsTtlMs
    })
    return { attempts, blocked: false }
  }

  async reset(ip: string): Promise<void> {
    this.state.delete(ip)
  }

  private current(ip: string, now: number): AttemptState | undefined {
    const entry = this.state.get(ip)
    if (!entry) return undefined

    if (entry.blockedUntil !== undefined && entry.blockedUntil <= now) {
      this.state.delete(ip)
      return undefined
    }

    if (entry.blockedUntil === undefined && entry.attemptsExpireAt <= now) {
      this.state.delete(ip)
      return undefined
    }

    return entry
  }
}
