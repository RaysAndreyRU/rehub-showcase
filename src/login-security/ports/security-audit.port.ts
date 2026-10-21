import type { SecurityAuditEvent } from '../domain/login-security.types.js'

export interface SecurityAuditPort {
  append(event: SecurityAuditEvent): Promise<void>
}
