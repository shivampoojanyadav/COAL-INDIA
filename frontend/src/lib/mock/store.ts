/* ============================================================================
   MOCK STORE, a tiny in-memory "database" with localStorage persistence.

   Why this exists: the Django backend renders HTML, so there is no JSON API to
   read. Rather than block the entire frontend on a DRF refactor, the app runs
   against this store. It obeys the same shapes as the ORM, so swapping in the
   real backend later is a change to `api.ts` only, see `src/lib/api.ts`.

   Persistence is opt-out via `VITE_PERSIST_MOCKS=false`, which makes every
   reload return the pristine seed. That is what you want for a live demo.
   ========================================================================== */

import { buildSeed, type Database } from './seed'
import {
  calculatedStatusFor,
  calculateMineRisk,
  monitoringStatusFor,
} from '@/lib/risk'
import { MOCK_LATENCY, PERSIST_MOCKS } from '@/lib/env'

const STORAGE_KEY = 'CoaliZEN.mockdb.v1'

function persistEnabled(): boolean {
  return PERSIST_MOCKS
}

let db: Database | null = null

function hydrate(): Database {
  if (!persistEnabled() || typeof localStorage === 'undefined') return buildSeed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildSeed()
    const parsed = JSON.parse(raw) as Database
    // Cheap shape check: a seed bump should never crash the app on a stale blob.
    if (!Array.isArray(parsed?.mines) || parsed.mines.length === 0) return buildSeed()
    return parsed
  } catch {
    return buildSeed()
  }
}

export function getDb(): Database {
  if (!db) db = hydrate()
  return db
}

export function saveDb(): void {
  if (!db || !persistEnabled() || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Quota exceeded, the app stays functional, it just stops persisting.
  }
}

export function resetDb(): void {
  db = buildSeed()
  if (persistEnabled() && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* no-op */
    }
  }
}

export function nextId(): number {
  const d = getDb()
  d.seq += 1
  return d.seq
}

/**
 * Recomputes the two ORM `property` columns and the denormalised `*_name`
 * fields. Django does this in `Compliance.monitoring_status`,
 * `ContractorDocument.calculated_status` and every queryset annotation; doing it
 * here keeps the mock honest instead of trusting whatever was stored.
 */
export function refreshDerived(): void {
  const d = getDb()

  for (const c of d.compliances) c.monitoring_status = monitoringStatusFor(c)
  for (const doc of d.documents) doc.calculated_status = calculatedStatusFor(doc)

  for (const mine of d.mines) {
    const manager = mine.manager ? d.users.find((u) => u.id === mine.manager) : undefined
    mine.manager_name = manager ? `${manager.first_name} ${manager.last_name}` : null
  }

  for (const c of d.compliances) {
    c.mine_name = d.mines.find((m) => m.id === c.mine)?.name ?? ''
  }
  for (const i of d.inspections) {
    i.mine_name = d.mines.find((m) => m.id === i.mine)?.name ?? ''
    i.violation_count = d.violations.filter((v) => v.inspection === i.id).length
  }
  for (const v of d.violations) {
    v.mine_name = d.mines.find((m) => m.id === v.mine)?.name ?? ''
  }
  for (const c of d.contractors) {
    c.mine_name = d.mines.find((m) => m.id === c.mine)?.name ?? ''
    const docs = d.documents.filter((x) => x.contractor === c.id)
    c.document_count = docs.length
    c.expiring_document_count = docs.filter((x) => x.calculated_status !== 'VALID').length
  }
}

/**
 * Re-score one mine's risk. Django does this from `Mine.save()` and from the
 * `save()` of every model that feeds the engine, so a new violation moves the
 * score immediately rather than at the next scheduled recompute.
 */
export function recalculateMineRisk(mineId: number): void {
  const d = getDb()
  const mine = d.mines.find((m) => m.id === mineId)
  if (!mine) return

  const contractorIds = d.contractors.filter((c) => c.mine === mineId).map((c) => c.id)

  const result = calculateMineRisk({
    violations: d.violations.filter((v) => v.mine === mineId),
    compliances: d.compliances.filter((c) => c.mine === mineId),
    inspections: d.inspections.filter((i) => i.mine === mineId),
    documents: d.documents.filter((doc) => contractorIds.includes(doc.contractor)),
  })

  mine.risk_score = result.score.toFixed(2)
  mine.risk_level = result.level
  mine.risk_updated_at = new Date().toISOString()
}

/** A short artificial delay so loading states are actually visible in dev. */
export function latency(ms = MOCK_LATENCY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}