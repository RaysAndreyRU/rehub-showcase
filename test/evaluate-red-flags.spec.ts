import { describe, expect, it } from 'vitest'
import { EvaluateRedFlags } from '../src/red-flag-engine/application/evaluate-red-flags.js'
import type {
  ClinicalMeasurement,
  RedFlagOperator,
  RedFlagRule
} from '../src/red-flag-engine/domain/red-flag.types.js'

const now = new Date('2026-06-01T12:00:00.000Z')

function rule(overrides: Partial<RedFlagRule> = {}): RedFlagRule {
  return {
    id: 'rule-pain',
    code: 'PAIN_HIGH',
    status: 'ACTIVE',
    metricKey: 'pain_score',
    operator: 'GTE',
    threshold: 7,
    windowHours: 24,
    cooldownHours: 12,
    severity: 'HIGH',
    recommendationText: 'Pause the session and contact the supervising clinician.',
    autoAction: 'STOP_TRAINING',
    ...overrides
  }
}

function measurement(overrides: Partial<ClinicalMeasurement> = {}): ClinicalMeasurement {
  return {
    id: 'measurement-1',
    patientId: 'patient-42',
    metricKey: 'pain_score',
    value: 8,
    observedAt: new Date('2026-06-01T11:30:00.000Z'),
    ...overrides
  }
}

describe('EvaluateRedFlags', () => {
  const evaluator = new EvaluateRedFlags()

  it('creates a candidate from the latest matching measurement', () => {
    const result = evaluator.execute({
      patientId: 'patient-42',
      rules: [rule()],
      measurements: [
        measurement({ id: 'older', value: 10, observedAt: new Date('2026-06-01T10:00:00.000Z') }),
        measurement({ id: 'latest', value: 8 })
      ],
      now
    })

    expect(result).toEqual([
      expect.objectContaining({
        ruleCode: 'PAIN_HIGH',
        measurementId: 'latest',
        observedValue: 8,
        severity: 'HIGH',
        autoAction: 'STOP_TRAINING'
      })
    ])
    expect(result[0]?.detectedAt).not.toBe(now)
    expect(result[0]?.detectedAt).toEqual(now)
  })

  it.each([
    ['GT', 8, 7, true],
    ['GT', 7, 7, false],
    ['GTE', 7, 7, true],
    ['LT', 5, 7, true],
    ['LTE', 7, 7, true],
    ['EQ', 7, 7, true],
    ['NEQ', 6, 7, true],
    ['NEQ', 7, 7, false]
  ] satisfies Array<[RedFlagOperator, number, number, boolean]>) (
    'evaluates %s deterministically',
    (operator, value, threshold, expected) => {
      const result = evaluator.execute({
        patientId: 'patient-42',
        rules: [rule({ operator, threshold })],
        measurements: [measurement({ value })],
        now
      })

      expect(result.length > 0).toBe(expected)
    }
  )

  it('ignores inactive rules, unrelated patients, expired and future measurements', () => {
    const result = evaluator.execute({
      patientId: 'patient-42',
      rules: [rule({ id: 'inactive', status: 'INACTIVE' }), rule({ id: 'active' })],
      measurements: [
        measurement({ patientId: 'patient-99' }),
        measurement({ id: 'expired', observedAt: new Date('2026-05-30T08:00:00.000Z') }),
        measurement({ id: 'future', observedAt: new Date('2026-06-01T13:00:00.000Z') })
      ],
      now
    })

    expect(result).toEqual([])
  })

  it('suppresses repeated events during cooldown and allows them afterwards', () => {
    const duringCooldown = evaluator.execute({
      patientId: 'patient-42',
      rules: [rule({ lastTriggeredAt: new Date('2026-06-01T06:00:00.000Z') })],
      measurements: [measurement()],
      now
    })
    const afterCooldown = evaluator.execute({
      patientId: 'patient-42',
      rules: [rule({ lastTriggeredAt: new Date('2026-05-31T23:00:00.000Z') })],
      measurements: [measurement()],
      now
    })

    expect(duringCooldown).toEqual([])
    expect(afterCooldown).toHaveLength(1)
  })
})
