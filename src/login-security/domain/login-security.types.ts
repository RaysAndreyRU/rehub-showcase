export type LoginIdentity = {
  userId: string
  displayName: string
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT'
}

export type LoginOutcome =
  | {
      success: true
      ip: string
      identifier: string
      identity: LoginIdentity
    }
  | {
      success: false
      ip: string
      identifier: string
    }

export type SecurityAuditEvent = {
  action: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILED'
  ip: string
  identifier: string
  actor: LoginIdentity | null
  occurredAt: Date
}

export type LoginDecision = {
  accepted: boolean
  temporarilyBlocked: boolean
  failedAttempts: number
  retryAt?: Date
}
