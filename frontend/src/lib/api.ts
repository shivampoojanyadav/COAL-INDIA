/* ============================================================================
   API LAYER — the single boundary between the UI and its data source.

   Two drivers behind one interface:

     mock  (default) — `src/lib/mock/*`, seeded, persisted to localStorage
     live            — `fetch` against `VITE_API_BASE_URL`, e.g. Django REST

   Select with `VITE_DATA_SOURCE=live`. Every screen imports `api` from here and
   never touches the mock directly, so wiring the real backend later is a
   one-line environment change plus filling in the `live` methods below.

   The mock driver also enforces the same role rules as `mines/decorators.py`,
   so a Contractor cannot read the compliance board even in demo mode.
   ========================================================================== */

import type {
  AuditLog,
  AppNotification,
  Compliance,
  Contractor,
  ContractorDocument,
  Inspection,
  Mine,
  RiskHistory,
  RiskLevel,
  RiskRow,
  Severity,
  User,
  Violation,
} from '@/lib/types'
import { hasRole } from '@/lib/roles'
import type { Role } from '@/lib/types'
import {
  CAN_MANAGE_COMPLIANCE,
  CAN_MANAGE_CONTRACTORS,
  CAN_MANAGE_DOCUMENTS,
  CAN_MANAGE_INSPECTIONS,
  CAN_MANAGE_MINES,
  CAN_MANAGE_VIOLATIONS,
  CAN_USE_ASSISTANT,
  CAN_VIEW_AUDIT,
  CAN_VIEW_COMPLIANCE,
  CAN_VIEW_CONTRACTORS,
  CAN_VIEW_INSPECTIONS,
  CAN_VIEW_MINES,
  CAN_VIEW_RISK,
  CAN_VIEW_VIOLATIONS,
} from '@/lib/roles'
import { buildRiskRows, calculateMineRisk, predictMineRisk, generateRiskExplanation } from '@/lib/risk'
import {
  getDb,
  latency,
  nextId,
  recalculateMineRisk,
  refreshDerived,
  resetDb,
  saveDb,
} from '@/lib/mock/store'
import { DEMO_PASSWORDS } from '@/lib/mock/seed'
import { API_BASE_URL, DATA_SOURCE } from '@/lib/env'
import { readSession } from '@/lib/session'

const BASE = API_BASE_URL
export { DATA_SOURCE } from '@/lib/env'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* ============================================================================
   SHARED FILTER TYPES
   ========================================================================== */

export interface ListParams {
  q?: string
  mine?: number
  status?: string
  severity?: string
  subsidiary?: string
  state?: string
  limit?: number
  offset?: number
  ordering?: string
}

function applyList<T extends Record<string, unknown>>(
  rows: T[],
  params: ListParams = {},
  searchFields: (keyof T)[] = [],
): T[] {
  let out = rows

  if (params.q && searchFields.length) {
    const needle = params.q.toLowerCase()
    out = out.filter((row) =>
      searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle)),
    )
  }
  if (params.mine != null) out = out.filter((r) => r.mine === params.mine)
  if (params.subsidiary) out = out.filter((r) => r.subsidiary === params.subsidiary)
  if (params.state) out = out.filter((r) => r.state === params.state)
  if (params.status) out = out.filter((r) => r.status === params.status)
  if (params.severity) out = out.filter((r) => r.severity === params.severity)

  if (params.ordering) {
    const desc = params.ordering.startsWith('-')
    const key = (desc ? params.ordering.slice(1) : params.ordering) as keyof T
    out = [...out].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv
      return desc
        ? String(bv ?? '').localeCompare(String(av ?? ''))
        : String(av ?? '').localeCompare(String(bv ?? ''))
    })
  }

  const offset = params.offset ?? 0
  const limit = params.limit
  return limit != null ? out.slice(offset, offset + limit) : out.slice(offset)
}

/* ============================================================================
   DRIVER: MOCK
   ========================================================================== */

async function mockAuthenticate(username: string, password: string): Promise<User> {
  await latency(320)
  const user = getDb().users.find((u) => u.username === username.toLowerCase().trim())
  if (!user) throw new ApiError('No account matches those credentials.', 401)
  if (password !== DEMO_PASSWORDS[user.username]) {
    throw new ApiError('Incorrect password. Check the demo credentials below.', 401)
  }
  if (!user.is_active) throw new ApiError('This account has been deactivated.', 403)
  return user
}

const mock: ApiDriver = {
  authenticate: mockAuthenticate,

  async me() {
    await latency(60)
    // `currentUser` is module state, so it is empty after a reload. Rebuild it
    // from the stored session id — the same thing `AuthContext` just read.
    const user = currentUser ?? resolveStoredUser()
    if (!user) throw new ApiError('Not authenticated.', 401)
    currentUser = user
    return user
  },

  async logout() {
    await latency(60)
  },

  async listMines(params = {}) {
    await guard(CAN_VIEW_MINES)
    await latency()
    return applyList(getDb().mines as unknown as Record<string, unknown>[], params, [
      'name',
      'mine_code',
      'location',
      'state',
      'district',
      'subsidiary',
    ]) as unknown as Mine[]
  },

  async getMine(id) {
    await guard(CAN_VIEW_MINES)
    await latency(80)
    const mine = getDb().mines.find((m) => m.id === id)
    if (!mine) throw new ApiError('Mine not found.', 404)
    return mine
  },

  async createMine(payload) {
    await guard(CAN_MANAGE_MINES)
    await latency()
    const db = getDb()
    const mine: Mine = {
      ...(payload as Mine),
      id: nextId(),
      risk_score: '0.00',
      risk_level: 'LOW',
      risk_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.mines.push(mine)
    refreshDerived()
    recalculateMineRisk(mine.id)
    saveDb()
    return mine
  },

  async updateMine(id, payload) {
    await guard(CAN_MANAGE_MINES)
    await latency()
    const mine = getDb().mines.find((m) => m.id === id)
    if (!mine) throw new ApiError('Mine not found.', 404)
    Object.assign(mine, payload, { id: mine.id, updated_at: new Date().toISOString() })
    refreshDerived()
    // Mirrors `Mine.save()`, which always recomputes.
    recalculateMineRisk(mine.id)
    saveDb()
    return mine
  },

  async deleteMine(id) {
    await guard(CAN_MANAGE_MINES)
    await latency()
    const db = getDb()
    const before = db.mines.length
    db.mines = db.mines.filter((m) => m.id !== id)
    if (db.mines.length === before) throw new ApiError('Mine not found.', 404)
    refreshDerived()
    saveDb()
  },

  async listCompliances(params = {}) {
    await guard(CAN_VIEW_COMPLIANCE)
    await latency()
    refreshDerived()
    return applyList(
      getDb().compliances as unknown as Record<string, unknown>[],
      params,
      ['requirement', 'mine_name', 'description'],
    ) as unknown as Compliance[]
  },

  async createCompliance(payload) {
    await guard(CAN_MANAGE_COMPLIANCE)
    await latency()
    const db = getDb()
    const row: Compliance = {
      ...(payload as Compliance),
      id: nextId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.compliances.push(row)
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async updateCompliance(id, payload) {
    await guard(CAN_MANAGE_COMPLIANCE)
    await latency()
    const row = getDb().compliances.find((c) => c.id === id)
    if (!row) throw new ApiError('Compliance item not found.', 404)
    Object.assign(row, payload, { id: row.id, updated_at: new Date().toISOString() })
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async listInspections(params = {}) {
    await guard(CAN_VIEW_INSPECTIONS)
    await latency()
    refreshDerived()
    return applyList(
      getDb().inspections as unknown as Record<string, unknown>[],
      params,
      ['mine_name', 'inspector_name', 'findings'],
    ) as unknown as Inspection[]
  },

  async createInspection(payload) {
    await guard(CAN_MANAGE_INSPECTIONS)
    await latency()
    const db = getDb()
    const row: Inspection = {
      ...(payload as Inspection),
      id: nextId(),
      violation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.inspections.push(row)
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async updateInspection(id, payload) {
    await guard(CAN_MANAGE_INSPECTIONS)
    await latency()
    const row = getDb().inspections.find((i) => i.id === id)
    if (!row) throw new ApiError('Inspection not found.', 404)
    Object.assign(row, payload, { id: row.id, updated_at: new Date().toISOString() })
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async listViolations(params = {}) {
    await guard(CAN_VIEW_VIOLATIONS)
    await latency()
    refreshDerived()
    return applyList(
      getDb().violations as unknown as Record<string, unknown>[],
      params,
      ['title', 'description', 'mine_name', 'corrective_action'],
    ) as unknown as Violation[]
  },

  async createViolation(payload) {
    await guard(CAN_MANAGE_VIOLATIONS)
    await latency()
    const db = getDb()
    const row: Violation = {
      ...(payload as Violation),
      id: nextId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.violations.push(row)
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async updateViolation(id, payload) {
    await guard(CAN_MANAGE_VIOLATIONS)
    await latency()
    const db = getDb()
    const row = db.violations.find((v) => v.id === id)
    if (!row) throw new ApiError('Violation not found.', 404)
    Object.assign(row, payload, { id: row.id, updated_at: new Date().toISOString() })
    refreshDerived()
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async listContractors(params = {}) {
    await guard(CAN_VIEW_CONTRACTORS)
    await latency()
    refreshDerived()
    return applyList(
      getDb().contractors as unknown as Record<string, unknown>[],
      params,
      ['name', 'company_name', 'contact_person', 'mine_name', 'contractor_code'],
    ) as unknown as Contractor[]
  },

  async createContractor(payload) {
    await guard(CAN_MANAGE_CONTRACTORS)
    await latency()
    const db = getDb()
    const row: Contractor = {
      ...(payload as Contractor),
      id: nextId(),
      document_count: 0,
      expiring_document_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.contractors.push(row)
    refreshDerived()
    // A contractor's documents feed the mine's risk score, so adding one can
    // immediately change that score.
    recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async updateContractor(id, payload) {
    await guard(CAN_MANAGE_CONTRACTORS)
    await latency()
    const row = getDb().contractors.find((c) => c.id === id)
    if (!row) throw new ApiError('Contractor not found.', 404)
    const previousMine = row.mine
    Object.assign(row, payload, { id: row.id, updated_at: new Date().toISOString() })
    refreshDerived()
    // Re-score both, in case the contractor was moved to a different mine.
    recalculateMineRisk(previousMine)
    if (row.mine !== previousMine) recalculateMineRisk(row.mine)
    saveDb()
    return row
  },

  async deleteContractor(id) {
    await guard(CAN_MANAGE_CONTRACTORS)
    await latency()
    const db = getDb()
    const existing = db.contractors.find((c) => c.id === id)
    if (!existing) throw new ApiError('Contractor not found.', 404)
    db.contractors = db.contractors.filter((c) => c.id !== id)
    refreshDerived()
    // Removing a contractor also removes its documents from the risk inputs.
    recalculateMineRisk(existing.mine)
    saveDb()
  },

  async listDocuments(params = {}) {
    await guard(CAN_VIEW_MINES)
    await latency()
    refreshDerived()
    let docs = getDb().documents
    if (params.contractor != null) docs = docs.filter((d) => d.contractor === params.contractor)
    return docs
  },

  async createDocument(payload) {
    await guard(CAN_MANAGE_DOCUMENTS)
    await latency()
    const db = getDb()
    const row: ContractorDocument = {
      ...(payload as ContractorDocument),
      id: nextId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.documents.push(row)
    refreshDerived()
    const owner = db.contractors.find((c) => c.id === row.contractor)
    if (owner) recalculateMineRisk(owner.mine)
    saveDb()
    return row
  },

  async listNotifications() {
    await requireAuth()
    await latency()
    return getDb().notifications.filter((n) => n.recipient === currentUser?.id)
  },

  async markNotificationRead(id) {
    await requireAuth()
    await latency(60)
    const n = getDb().notifications.find((x) => x.id === id)
    if (n) {
      n.is_read = true
      saveDb()
    }
    return n
  },

  async markAllNotificationsRead() {
    await requireAuth()
    await latency(60)
    getDb().notifications.forEach((n) => {
      if (n.recipient === currentUser?.id) n.is_read = true
    })
    saveDb()
  },

  async listRiskHistory(mine) {
    await guard(CAN_VIEW_RISK)
    await latency()
    return getDb().riskHistory.filter((h) => h.mine === mine)
  },

  async riskBoard() {
    await guard(CAN_VIEW_RISK)
    await latency()
    const db = getDb()
    return buildRiskRows(
      db.mines,
      db.violations,
      db.compliances,
      db.inspections,
      db.contractors,
      db.documents,
      db.riskHistory,
    )
  },

  async riskDetail(mineId) {
    await guard(CAN_VIEW_RISK)
    await latency()
    const db = getDb()
    const mine = db.mines.find((m) => m.id === mineId)
    if (!mine) throw new ApiError('Mine not found.', 404)

    const violations = db.violations.filter((v) => v.mine === mineId)
    const compliances = db.compliances.filter((c) => c.mine === mineId)
    const inspections = db.inspections.filter((i) => i.mine === mineId)
    const contractorIds = db.contractors.filter((c) => c.mine === mineId).map((c) => c.id)
    const documents = db.documents.filter((d) => contractorIds.includes(d.contractor))

    const rules = calculateMineRisk({ violations, compliances, inspections, documents })
    const ml = predictMineRisk(rules, violations.length * 3 + compliances.length + mineId)
    const ai = generateRiskExplanation(rules, ml)

    return {
      mine,
      risk: { ...rules, risk_updated_at: mine.risk_updated_at },
      ml_prediction: ml,
      ai_explanation: ai,
      history: db.riskHistory.filter((h) => h.mine === mineId).reverse(),
      violations,
      compliances,
      inspections,
    }
  },

  async recomputeRisk() {
    await guard(CAN_MANAGE_MINES)
    await latency(400)
    const db = getDb()
    for (const mine of db.mines) {
      const contractorIds = db.contractors.filter((c) => c.mine === mine.id).map((c) => c.id)
      const result = calculateMineRisk({
        violations: db.violations.filter((v) => v.mine === mine.id),
        compliances: db.compliances.filter((c) => c.mine === mine.id),
        inspections: db.inspections.filter((i) => i.mine === mine.id),
        documents: db.documents.filter((d) => contractorIds.includes(d.contractor)),
      })
      mine.risk_score = result.score.toFixed(2)
      mine.risk_level = result.level
      mine.risk_updated_at = new Date().toISOString()
      db.riskHistory.push({
        id: db.riskHistory.length + 1,
        mine: mine.id,
        risk_score: mine.risk_score,
        risk_level: mine.risk_level,
        risk_factors: result.factors.join('; '),
        recorded_at: new Date().toISOString(),
      })
    }
    saveDb()
    return db.mines
  },

  async listAuditLogs(params = {}) {
    await guard(CAN_VIEW_AUDIT)
    await latency()
    return applyList(
      getDb().auditLogs as unknown as Record<string, unknown>[],
      params,
      ['user_name', 'description', 'model_name', 'action'],
    ) as unknown as AuditLog[]
  },

  async assistantQuery(prompt) {
    await guard(CAN_USE_ASSISTANT)
    await latency(600)
    const db = getDb()
    const mineCount = db.mines.length
    const openViolations = db.violations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')
    const overdue = db.compliances.filter((c) => c.monitoring_status === 'OVERDUE')
    const expiredDocs = db.documents.filter((d) => d.calculated_status === 'EXPIRED')
    const criticalMines = db.mines.filter((m) => m.risk_level === 'CRITICAL' || m.risk_level === 'HIGH')

    const mine = db.mines.find(
      (m) => prompt.toLowerCase().includes(m.name.toLowerCase().split(' ')[0] ?? ''),
    )
    if (mine) {
      const mineViolations = db.violations.filter((v) => v.mine === mine.id)
      const open = mineViolations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')
      return {
        text: `${mine.name} (${mine.mine_code}) carries a risk score of ${mine.risk_score} — ${mine.risk_level}. ${mineViolations.length} violations are on record, ${open.length} of which remain open. The nearest compliance deadline is ${nearestDeadline(db, mine.id)}.`,
        citations: [
          { label: 'Mine register', value: mine.mine_code },
          { label: 'Violations', value: String(mineViolations.length) },
          { label: 'Risk score', value: mine.risk_score },
        ],
      }
    }

    return {
      text: `Across ${mineCount} registered mines there are ${openViolations.length} unresolved violations, ${overdue.length} overdue compliance items and ${expiredDocs.length} expired contractor documents. ${criticalMines.length} mines are currently rated HIGH or CRITICAL risk.`,
      citations: [
        { label: 'Mines', value: String(mineCount) },
        { label: 'Open violations', value: String(openViolations.length) },
        { label: 'Overdue compliance', value: String(overdue.length) },
        { label: 'Expired documents', value: String(expiredDocs.length) },
      ],
    }
  },

  resetMocks: resetDb,
}

function nearestDeadline(db: ReturnType<typeof getDb>, mineId: number): string {
  const rows = db.compliances
    .filter((c) => c.mine === mineId && c.status === 'PENDING')
    .map((c) => c.due_date)
    .sort()
  return rows[0] ?? 'not scheduled'
}

/* ============================================================================
   DRIVER: LIVE (Django REST / any JSON backend)
   ========================================================================== */

async function http<T>(
  path: string,
  init?: RequestInit & { params?: ListParams },
): Promise<T> {
  if (!BASE) throw new ApiError('VITE_API_BASE_URL is not set; cannot use live mode.', 500)

  const url = new URL(path.replace(/^\//, ''), BASE.endsWith('/') ? BASE : `${BASE}/`)
  if (init?.params) {
    for (const [k, v] of Object.entries(init.params)) {
      if (v != null && v !== '') url.searchParams.set(k, String(v))
    }
  }

  const token = sessionStorage.getItem('CoaliZEN.token')
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 204) return undefined as T
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      /* keep the generic message */
    }
    throw new ApiError(detail, res.status)
  }
  return (await res.json()) as T
}

const live: ApiDriver = {
  authenticate: async (username, password) => {
    const body = await http<{ token: string; user: User }>('auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    sessionStorage.setItem('CoaliZEN.token', body.token)
    return body.user
  },
  me: () => http<User>('auth/me/'),
  logout: async () => {
    sessionStorage.removeItem('CoaliZEN.token')
  },
  listMines: (params) => http<Mine[]>('mines/', { params }),
  getMine: (id) => http<Mine>(`mines/${id}/`),
  createMine: (payload) => http<Mine>('mines/', { method: 'POST', body: JSON.stringify(payload) }),
  updateMine: (id, payload) => http<Mine>(`mines/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteMine: (id) => http<void>(`mines/${id}/`, { method: 'DELETE' }),
  listCompliances: (params) => http<Compliance[]>('compliances/', { params }),
  createCompliance: (payload) => http<Compliance>('compliances/', { method: 'POST', body: JSON.stringify(payload) }),
  updateCompliance: (id, payload) => http<Compliance>(`compliances/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  listInspections: (params) => http<Inspection[]>('inspections/', { params }),
  createInspection: (payload) => http<Inspection>('inspections/', { method: 'POST', body: JSON.stringify(payload) }),
  updateInspection: (id, payload) => http<Inspection>(`inspections/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  listViolations: (params) => http<Violation[]>('violations/', { params }),
  createViolation: (payload) => http<Violation>('violations/', { method: 'POST', body: JSON.stringify(payload) }),
  updateViolation: (id, payload) => http<Violation>(`violations/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  listContractors: (params) => http<Contractor[]>('contractors/', { params }),
  createContractor: (payload) => http<Contractor>('contractors/', { method: 'POST', body: JSON.stringify(payload) }),
  updateContractor: (id, payload) => http<Contractor>(`contractors/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteContractor: (id) => http<void>(`contractors/${id}/`, { method: 'DELETE' }),
  listDocuments: (params) => http<ContractorDocument[]>('documents/', { params }),
  createDocument: (payload) => http<ContractorDocument>('documents/', { method: 'POST', body: JSON.stringify(payload) }),
  listNotifications: () => http<AppNotification[]>('notifications/'),
  markNotificationRead: (id) => http<AppNotification>(`notifications/${id}/read/`, { method: 'POST' }),
  markAllNotificationsRead: () => http<void>('notifications/read-all/', { method: 'POST' }),
  listRiskHistory: (mine) => http<RiskHistory[]>(`risk/${mine}/history/`),
  riskBoard: () => http<RiskRow[]>('risk/board/'),
  riskDetail: (mineId) => http<RiskDetail>(`risk/${mineId}/`),
  recomputeRisk: () => http<Mine[]>('risk/recompute/', { method: 'POST' }),
  listAuditLogs: (params) => http<AuditLog[]>('audit/', { params }),
  assistantQuery: (prompt) => http<AssistantAnswer>('assistant/query/', { method: 'POST', body: JSON.stringify({ prompt }) }),
  resetMocks: resetDb,
}

/* ============================================================================
   DRIVER INTERFACE + SESSION
   ========================================================================== */

export interface RiskDetail {
  mine: Mine
  risk: { score: number; level: RiskLevel; factors: string[]; risk_updated_at: string | null }
  ml_prediction: { score: number; level: RiskLevel; factors: string[] }
  ai_explanation: { score: number; level: RiskLevel; explanations: string[]; recommendations: string[] }
  history: RiskHistory[]
  violations: Violation[]
  compliances: Compliance[]
  inspections: Inspection[]
}

export interface AssistantAnswer {
  text: string
  citations: { label: string; value: string }[]
}

export interface ApiDriver {
  authenticate(username: string, password: string): Promise<User>
  me(): Promise<User>
  logout(): Promise<void>

  listMines(params?: ListParams): Promise<Mine[]>
  getMine(id: number): Promise<Mine>
  createMine(payload: Partial<Mine>): Promise<Mine>
  updateMine(id: number, payload: Partial<Mine>): Promise<Mine>
  deleteMine(id: number): Promise<void>

  listCompliances(params?: ListParams & { mine?: number }): Promise<Compliance[]>
  createCompliance(payload: Partial<Compliance>): Promise<Compliance>
  updateCompliance(id: number, payload: Partial<Compliance>): Promise<Compliance>

  listInspections(params?: ListParams): Promise<Inspection[]>
  createInspection(payload: Partial<Inspection>): Promise<Inspection>
  updateInspection(id: number, payload: Partial<Inspection>): Promise<Inspection>

  listViolations(params?: ListParams & { severity?: Severity }): Promise<Violation[]>
  createViolation(payload: Partial<Violation>): Promise<Violation>
  updateViolation(id: number, payload: Partial<Violation>): Promise<Violation>

  listContractors(params?: ListParams): Promise<Contractor[]>
  createContractor(payload: Partial<Contractor>): Promise<Contractor>
  updateContractor(id: number, payload: Partial<Contractor>): Promise<Contractor>
  deleteContractor(id: number): Promise<void>

  listDocuments(params?: ListParams & { contractor?: number }): Promise<ContractorDocument[]>
  createDocument(payload: Partial<ContractorDocument>): Promise<ContractorDocument>

  listNotifications(): Promise<AppNotification[]>
  markNotificationRead(id: number): Promise<AppNotification | undefined>
  markAllNotificationsRead(): Promise<void>

  listRiskHistory(mine: number): Promise<RiskHistory[]>
  riskBoard(): Promise<RiskRow[]>
  riskDetail(mineId: number): Promise<RiskDetail>
  recomputeRisk(): Promise<Mine[]>

  listAuditLogs(params?: ListParams): Promise<AuditLog[]>

  assistantQuery(prompt: string): Promise<AssistantAnswer>

  resetMocks(): void
}

/** The signed-in user, used by the mock driver for per-user scoping. */
let currentUser: User | null = null
export function setCurrentUser(user: User | null): void {
  currentUser = user
}

/**
 * Look the signed-in user up by id after a page reload. Returns `null` if the
 * stored id no longer matches an active account, which correctly forces the
 * user back to the login screen instead of trusting a stale blob.
 */
function resolveStoredUser(): User | null {
  const stored = readSession()
  if (!stored) return null
  return getDb().users.find((u) => u.id === stored.id && u.is_active) ?? null
}

/**
 * Authentication-only check, for endpoints that every signed-in account may
 * call but which must never return quietly-empty results to an anonymous
 * caller.
 */
function requireAuth(): void {
  if (DATA_SOURCE === 'live') return
  if (!currentUser) throw new ApiError('Not authenticated.', 401)
}

export const api: ApiDriver = DATA_SOURCE === 'live' ? live : mock

/**
 * Write guard mirroring `mines/decorators.py::role_required`. Throwing here
 * means an unauthorised screen fails loudly in dev instead of quietly showing
 * an empty table.
 */
export async function guard(allowed: Role[]): Promise<void> {
  if (DATA_SOURCE === 'live') return
  if (!currentUser) throw new ApiError('Not authenticated.', 401)
  if (!hasRole(currentUser.role, allowed)) {
    throw new ApiError(`Your role (${currentUser.role}) is not permitted to perform this action.`, 403)
  }
}