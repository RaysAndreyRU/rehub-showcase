import type { LoginDecision, LoginOutcome } from '../domain/login-security.types.js'
import type { LoginAttemptsPort } from '../ports/login-attempts.port.js'
import type { SecurityAuditPort } from '../ports/security-audit.port.js'

export type Clock = {
  now(): Date
}

export class RecordLoginOutcome {
  constructor(
    private readonly audit: SecurityAuditPort,
    private readonly attempts: LoginAttemptsPort,
    private readonly clock: Clock
  ) {}

  async isAllowed(ip: string): Promise<boolean> {
    return !(await this.attempts.isBlocked(ip, this.clock.now()))
  }

  async execute(outcome: LoginOutcome): Promise<LoginDecision> {
    const occurredAt = this.clock.now()

    if (outcome.success) {
      await this.attempts.reset(outcome.ip)
      await this.audit.append({
        action: 'AUTH_LOGIN_SUCCESS',
        ip: outcome.ip,
        identifier: outcome.identifier,
        actor: outcome.identity,
        occurredAt
      })

      return { accepted: true, temporarilyBlocked: false, failedAttempts: 0 }
    }

    await this.audit.append({
      action: 'AUTH_LOGIN_FAILED',
      ip: outcome.ip,
      identifier: outcome.identifier,
      actor: null,
      occurredAt
    })

    const failure = await this.attempts.registerFailure(outcome.ip, occurredAt)
    return {
      accepted: false,
      temporarilyBlocked: failure.blocked,
      failedAttempts: failure.attempts,
      ...(failure.retryAt ? { retryAt: failure.retryAt } : {})
    }
  }
}
