export type FailureRegistration = {
  attempts: number
  blocked: boolean
  retryAt?: Date
}

export interface LoginAttemptsPort {
  isBlocked(ip: string, now: Date): Promise<boolean>
  registerFailure(ip: string, now: Date): Promise<FailureRegistration>
  reset(ip: string): Promise<void>
}
