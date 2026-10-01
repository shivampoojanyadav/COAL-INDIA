/* ============================================================================
   Risk engine — a faithful TypeScript port of `mines/risk_engine.py`, plus
   `mines/ai_engine.py` and the level thresholds in `mines/ml/predict.py`.
   Keeping the same arithmetic means the UI and the backend never disagree.
   ========================================================================== */

import type { RiskLevel, RiskResult, RiskRow } from './types'
import {
  type Compliance,
  type Contractor,
  type ContractorDocument,
  type Inspection,
  type Mine,
  type Violation,
} from './types'
import { daysUntil } from './format'

export const RISK_THRESHOLDS = {
  MEDIUM: 25,
  HIGH: 50,
  CRITICAL: 75,
} as const

export function levelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH'
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM'
  return 'LOW'
}

const SEVERITY_WEIGHT: Record<string, number> = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20,
  CRITICAL: 35,
}

const SEVERITY_LABEL: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export interface RiskInput {
  violations: Violation[]
  compliances: Compliance[]
  inspections: Inspection[]
  documents: ContractorDocument[]
}

/**
 * Mirrors `calculate_mine_risk`. Same weights, same caps, same thresholds.
 * Cap order matters: violations are uncapped (summed), then +30 / +20 / +20
 * for the other three, then the whole thing is clamped to 100.
 */
export function calculateMineRisk(input: RiskInput): RiskResult {
  let score = 0
  const factors: string[] = []

  // --- violations (uncapped) ---
  for (const v of input.violations) {
    if (v.status !== 'OPEN' && v.status !== 'IN_PROGRESS') continue
    score += SEVERITY_WEIGHT[v.severity] ?? 0
    factors.push(`${SEVERITY_LABEL[v.severity] ?? v.severity} severity violation`)
  }

  // --- overdue compliance, cap +30 ---
  const overdue = input.compliances.filter(
    (c) => c.status === 'PENDING' && (daysUntil(c.due_date) ?? 0) < 0,
  ).length
  if (overdue) {
    score += Math.min(overdue * 10, 30)
    factors.push(`${overdue} overdue compliance item(s)`)
  }

  // --- overdue inspections, cap +20 ---
  const stale = input.inspections.filter(
    (i) => i.status === 'SCHEDULED' && (daysUntil(i.inspection_date) ?? 0) < 0,
  ).length
  if (stale) {
    score += Math.min(stale * 10, 20)
    factors.push(`${stale} overdue inspection(s)`)
  }

  // --- expired contractor documents, cap +20 ---
  const expired = input.documents.filter(
    (d) => (daysUntil(d.expiry_date) ?? 0) < 0,
  ).length
  if (expired) {
    score += Math.min(expired * 5, 20)
    factors.push(`${expired} expired contractor document(s)`)
  }

  score = Math.min(score, 100)
  return { score, level: levelForScore(score), factors }
}

/**
 * Deterministic stand-in for `mines/ml/predict.py`.
 * Nudges the rule-based score by a small feature-dependent epsilon so the
 * "model vs. rules" comparison on the risk dashboard is meaningful. In
 * live mode this value comes from the Django endpoint.
 */
export function predictMineRisk(ruleResult: RiskResult, signal: number): RiskResult {
  const epsilon = ((Math.abs(signal) % 7) - 3) * 1.6
  const score = Math.max(0, Math.min(100, ruleResult.score + epsilon))
  return { score: Math.round(score * 10) / 10, level: levelForScore(score), factors: ruleResult.factors }
}

/** Port of `generate_risk_explanation` in `mines/ai_engine.py`. */
export function generateRiskExplanation(riskResult: RiskResult, mlResult: RiskResult) {
  const explanations: string[] = riskResult.factors.length
    ? [...riskResult.factors]
    : ['No significant risk factors were detected.']

  const recommendations: string[] = []

  for (const factor of riskResult.factors) {
    const f = factor.toLowerCase()
    if (f.includes('critical')) {
      recommendations.push('Resolve critical-severity violations immediately.')
    } else if (f.includes('high')) {
      recommendations.push('Prioritize resolution of high-severity violations.')
    } else if (f.includes('overdue compliance')) {
      recommendations.push('Complete overdue compliance requirements.')
    } else if (f.includes('overdue inspection')) {
      recommendations.push('Schedule and complete the overdue inspection.')
    } else if (f.includes('expired contractor')) {
      recommendations.push('Renew expired contractor compliance documents.')
    }
  }

  switch (mlResult.level) {
    case 'CRITICAL':
      recommendations.push('Conduct immediate management review of this mine.')
      break
    case 'HIGH':
      recommendations.push('Schedule a priority inspection and corrective-action review.')
      break
    case 'MEDIUM':
      recommendations.push('Increase monitoring until outstanding issues are resolved.')
      break
    default:
      recommendations.push('Continue routine monitoring and compliance checks.')
  }

  return {
    score: mlResult.score,
    level: mlResult.level,
    explanations,
    recommendations: [...new Set(recommendations)],
  }
}

/** The `monitoring_status` property on the Compliance model. */
export function monitoringStatusFor(c: Compliance): Compliance['monitoring_status'] {
  if (c.status === 'COMPLETED') return 'COMPLETED'
  const days = daysUntil(c.due_date) ?? 0
  if (days < 0) return 'OVERDUE'
  if (days <= 7) return 'DUE_SOON'
  return 'UPCOMING'
}

/** The `calculated_status` property on the ContractorDocument model. */
export function calculatedStatusFor(d: ContractorDocument): ContractorDocument['calculated_status'] {
  const days = daysUntil(d.expiry_date) ?? 0
  if (days < 0) return 'EXPIRED'
  if (days <= 30) return 'EXPIRING'
  return 'VALID'
}

/** Assembles the risk dashboard rows (rules + ML + AI) for every mine. */
export function buildRiskRows(
  mines: Mine[],
  violations: Violation[],
  compliances: Compliance[],
  inspections: Inspection[],
  contractors: Contractor[],
  documents: ContractorDocument[],
  history: { mine: number; risk_score: string; risk_level: RiskLevel; recorded_at: string }[],
): RiskRow[] {
  return mines
    .map((mine) => {
      const mineViolations = violations.filter((v) => v.mine === mine.id)
      const mineCompliances = compliances.filter((c) => c.mine === mine.id)
      const mineInspections = inspections.filter((i) => i.mine === mine.id)
      const contractorIds = contractors.filter((c) => c.mine === mine.id).map((c) => c.id)
      const mineDocuments = documents.filter((d) => contractorIds.includes(d.contractor))

      const result = calculateMineRisk({
        violations: mineViolations,
        compliances: mineCompliances,
        inspections: mineInspections,
        documents: mineDocuments,
      })

      const signal = mineViolations.length * 3 + mineCompliances.length + mine.id
      const ml = predictMineRisk(result, signal)
      const ai = generateRiskExplanation(result, ml)

      // Recorded history for this mine, oldest → newest.
      const series = history
        .filter((h) => h.mine === mine.id)
        .slice()
        .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
        .map((h) => Number(h.risk_score))

      const trend = series.length ? series : [result.score]
      // Movement is measured against the last recorded point, not the first:
      // comparing to the oldest entry reports the whole year as a "change".
      const riskChange = result.score - (series[series.length - 1] ?? result.score)

      return {
        mine,
        score: result.score,
        level: result.level,
        factors: result.factors,
        risk_change: Math.round(riskChange * 10) / 10,
        trend,
        ml_score: ml.score,
        ml_level: ml.level,
        explanations: ai.explanations,
        recommendations: ai.recommendations,
      }
    })
    .sort((a, b) => b.score - a.score)
}
