import type {
  ClinicalMeasurement,
  RedFlagCandidate,
  RedFlagOperator,
  RedFlagRule
} from '../domain/red-flag.types.js'

export type EvaluateRedFlagsInput = {
  patientId: string
  rules: RedFlagRule[]
  measurements: ClinicalMeasurement[]
  now: Date
}

const HOUR_MS = 60 * 60 * 1_000

export class EvaluateRedFlags {
  execute(input: EvaluateRedFlagsInput): RedFlagCandidate[] {
    return input.rules.flatMap((rule) => {
      if (rule.status !== 'ACTIVE' || this.isCoolingDown(rule, input.now)) return []

      const windowStart = input.now.getTime() - rule.windowHours * HOUR_MS
      const measurement = input.measurements
        .filter(
          (item) =>
            item.patientId === input.patientId &&
            item.metricKey === rule.metricKey &&
            item.observedAt.getTime() >= windowStart &&
            item.observedAt.getTime() <= input.now.getTime()
        )
        .sort((left, right) => {
          const byTime = right.observedAt.getTime() - left.observedAt.getTime()
          return byTime || left.id.localeCompare(right.id)
        })[0]

      if (!measurement || !this.matches(measurement.value, rule.operator, rule.threshold)) return []

      return [
        {
          ruleId: rule.id,
          ruleCode: rule.code,
          patientId: input.patientId,
          measurementId: measurement.id,
          metricKey: rule.metricKey,
          observedValue: measurement.value,
          threshold: rule.threshold,
          severity: rule.severity,
          recommendationText: rule.recommendationText,
          autoAction: rule.autoAction,
          detectedAt: new Date(input.now.getTime())
        }
      ]
    })
  }

  private isCoolingDown(rule: RedFlagRule, now: Date): boolean {
    if (!rule.lastTriggeredAt) return false
    return now.getTime() - rule.lastTriggeredAt.getTime() < rule.cooldownHours * HOUR_MS
  }

  private matches(value: number, operator: RedFlagOperator, threshold: number): boolean {
    switch (operator) {
      case 'GT':
        return value > threshold
      case 'GTE':
        return value >= threshold
      case 'LT':
        return value < threshold
      case 'LTE':
        return value <= threshold
      case 'EQ':
        return value === threshold
      case 'NEQ':
        return value !== threshold
    }
  }
}
