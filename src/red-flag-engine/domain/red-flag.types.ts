export type RedFlagOperator = 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'NEQ'
export type RedFlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RedFlagAutoAction = 'NONE' | 'REDUCE_LOAD' | 'STOP_TRAINING'

export type RedFlagRule = {
  id: string
  code: string
  status: 'ACTIVE' | 'INACTIVE'
  metricKey: string
  operator: RedFlagOperator
  threshold: number
  windowHours: number
  cooldownHours: number
  severity: RedFlagSeverity
  recommendationText: string
  autoAction: RedFlagAutoAction
  lastTriggeredAt?: Date
}

export type ClinicalMeasurement = {
  id: string
  patientId: string
  metricKey: string
  value: number
  observedAt: Date
}

export type RedFlagCandidate = {
  ruleId: string
  ruleCode: string
  patientId: string
  measurementId: string
  metricKey: string
  observedValue: number
  threshold: number
  severity: RedFlagSeverity
  recommendationText: string
  autoAction: RedFlagAutoAction
  detectedAt: Date
}
