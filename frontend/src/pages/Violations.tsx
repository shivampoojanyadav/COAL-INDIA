/* ============================================================================
   VIOLATIONS — mirrors `mines/violation_list.html`, `violation_detail.html`
   and `violation_form.html`.

   Severity drives colour everywhere in the product (risk ramp), and the
   weighted severity total is the largest single contributor to a mine's risk
   score — see `calculateMineRisk` in `src/lib/risk.ts`.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CAN_MANAGE_VIOLATIONS } from '@/lib/roles'
import { formatDate, relativeDays } from '@/lib/format'
import type { Violation, ViolationStatus } from '@/lib/types'
import {
  SEVERITIES,
  SEVERITY_LABELS,
  VIOLATION_STATUS_LABELS,
} from '@/lib/types'
import { FilterRail, ScreenBody, ScreenHeader, type FilterDef } from '@/components/layout/Screen'
import {
  DataTable,
  Panel,
  RISK_STYLE,
  SeverityTag,
  StatCard,
  StatusPill,
  type Column,
} from '@/components/data/Data'
import { BarSeries } from '@/components/charts/Charts'
import { PillButton } from '@/components/primitives/Pill'
import { Cell, Section } from '@/components/primitives/Section'
import { Field, Select, Sheet, TextArea } from '@/components/forms/Sheet'
import { useSheetForm } from '@/components/forms/useSheetForm'

const STATUS_TONE: Record<ViolationStatus, 'critical' | 'warn' | 'accent' | 'positive'> = {
  OPEN: 'critical',
  IN_PROGRESS: 'warn',
  RESOLVED: 'accent',
  CLOSED: 'positive',
}

interface ViolationForm {
  mine: string
  title: string
  description: string
  severity: Violation['severity']
  status: Violation['status']
  corrective_action: string
  due_date: string
}

const BLANK: ViolationForm = {
  mine: '',
  title: '',
  description: '',
  severity: 'MEDIUM',
  status: 'OPEN',
  corrective_action: '',
  due_date: '',
}

function validate(form: ViolationForm): string | null {
  if (!form.mine) return 'Choose the mine this violation applies to.'
  if (!form.title.trim()) return 'Give the violation a title.'
  if (!form.description.trim()) return 'Record what was observed.'
  if (!form.corrective_action.trim()) return 'A violation needs a corrective action before it can be tracked.'
  if (!form.due_date) return 'Set a closure deadline so it appears in the overdue count.'
  return null
}

export function Violations() {
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(null)
  const editor = useSheetForm<ViolationForm>(BLANK)
  const editable = can(CAN_MANAGE_VIOLATIONS)
  const mines = useAsync(() => api.listMines(), [])

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      severity: params.get('severity') ?? '',
      status: params.get('status') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)
  const state = useAsync(() => api.listViolations(), [])

  const all = state.data ?? []

  const rows = useMemo(
    () =>
      all.filter((v) => {
        if (filters.severity && v.severity !== filters.severity) return false
        if (filters.status && v.status !== filters.status) return false
        if (debouncedQ) {
          const hay = `${v.title} ${v.description} ${v.mine_name} ${v.corrective_action} ${v.assigned_to_name ?? ''}`.toLowerCase()
          if (!hay.includes(debouncedQ.toLowerCase())) return false
        }
        return true
      }),
    [all, filters.severity, filters.status, debouncedQ],
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stats = useMemo(() => {
    const unresolved = all.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')
    const critical = unresolved.filter((v) => v.severity === 'CRITICAL')
    const overdue = unresolved.filter((v) => (v.due_date ? new Date(v.due_date) < new Date() : false))
    const resolved = all.filter((v) => v.status === 'RESOLVED' || v.status === 'CLOSED')
    return {
      unresolved: unresolved.length,
      critical: critical.length,
      overdue: overdue.length,
      resolutionRate: all.length ? Math.round((resolved.length / all.length) * 100) : 100,
    }
  }, [all])

  const severitySeries = useMemo(
    () =>
      SEVERITIES.map((s) => ({
        label: SEVERITY_LABELS[s],
        value: all.filter((v) => v.severity === s).length,
      })),
    [all],
  )

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    { key: 'severity', label: 'Severity', options: SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] })) },
    {
      key: 'status',
      label: 'Status',
      options: (Object.keys(VIOLATION_STATUS_LABELS) as ViolationStatus[]).map((s) => ({
        value: s,
        label: VIOLATION_STATUS_LABELS[s],
      })),
    },
  ]

  const columns: Column<Violation>[] = [
    {
      key: 'title',
      header: 'Violation',
      render: (v) => (
        <div className="min-w-0">
          <p className="truncate text-[15px]">{v.title}</p>
          <p className="eyebrow ink-40 mt-1 truncate">
            {v.mine_name} · raised {relativeDays(v.created_at)}
          </p>
        </div>
      ),
    },
    { key: 'severity', header: 'Severity', render: (v) => <SeverityTag severity={v.severity} /> },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusPill label={VIOLATION_STATUS_LABELS[v.status]} tone={STATUS_TONE[v.status]} />,
    },
    {
      key: 'due',
      header: 'Due',
      hideBelow: 'md',
      render: (v) => <span className="text-[14px]">{formatDate(v.due_date)}</span>,
    },
    {
      key: 'assignee',
      header: 'Assigned',
      hideBelow: 'lg',
      render: (v) => <span className="text-[14px]">{v.assigned_to_name ?? 'Unassigned'}</span>,
    },
    ...(editable
      ? [
          {
            key: 'edit',
            header: '',
            align: 'right' as const,
            render: (v: Violation) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenId(null)
                  editor.openEdit(v, violationToForm(v))
                }}
                className="eyebrow ink-50 hover:text-ink"
              >
                Edit
              </button>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <ScreenHeader
        eyebrow="Violations · enforcement"
        titleLines={['Severity graded,', 'closed in the open.']}
        lede="Every violation carries a severity weight that feeds the risk engine, a named owner, and a corrective action with a closure deadline."
        actions={
          editable ? (
            <PillButton variant="filled" onClick={() => editor.openCreate()}>
              Raise violation
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Unresolved" value={stats.unresolved} tone={stats.unresolved ? 'inverse' : 'default'} meta="Open or in progress" />
        <StatCard index={1} label="Critical open" value={stats.critical} tone="sun" meta="Weighted 35 points each in the engine" />
        <StatCard index={2} label="Past due date" value={stats.overdue} meta="Corrective action overdue" />
        <StatCard index={3} label="Resolution rate" value={stats.resolutionRate} suffix="%" meta={`${all.length} lifetime violations`} />
      </div>

      <Block>
        <Section>
          <Cell span={5}>
            <Panel title="Severity distribution" eyebrow="lifetime">
              <BarSeries data={severitySeries} colorMode="risk" />
            </Panel>
          </Cell>
          <Cell span={7} className="mt-8 lg:mt-0 lg:pl-8">
            <Panel title="How severity is scored" eyebrow="risk engine">
              <ul>
                {SEVERITIES.map((s) => (
                  <li key={s} className="flex items-center gap-5 border-b border-line py-3.5 last:border-0">
                    <span className="w-24 shrink-0">
                      <SeverityTag severity={s} />
                    </span>
                    <span className="eyebrow w-16 shrink-0 tabular">+{({ LOW: 5, MEDIUM: 10, HIGH: 20, CRITICAL: 35 })[s]}</span>
                    <span className="min-w-0 flex-1 text-[14px] ink-70">
                      points added to the mine risk score while unresolved
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[13px] ink-50">
                Violations are uncapped and summed first; the other three risk factors are capped
                at +30, +20 and +20 respectively, and the total is clamped to 100.
              </p>
            </Panel>
          </Cell>
        </Section>
      </Block>

      <FilterRail
        filters={filterDefs}
        values={filters}
        onChange={setFilter}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
        resultCount={rows.length}
        totalCount={all.length}
      />

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={rows.length === 0}
        emptyMessage="No violations match the current filters."
      >
        <DataTable columns={columns} rows={rows} onRowClick={(v) => setOpenId(openId === v.id ? null : v.id)} />
        {openId != null && <ViolationDetail id={openId} onClose={() => setOpenId(null)} />}
      </ScreenBody>

      {editor.sheet && (
        <Sheet
          open
          eyebrow={editor.sheet.mode === 'create' ? 'Violations' : 'Violations · edit'}
          title={editor.sheet.mode === 'create' ? 'Raise a violation' : 'Edit violation'}
          onClose={editor.close}
          submitLabel={editor.sheet.mode === 'create' ? 'Raise' : 'Save changes'}
          error={editor.sheet.error}
          onSubmit={() =>
            void editor.submit(validate, async (form) => {
              const id = editor.sheet?.row?.id
              const payload = {
                mine: Number(form.mine),
                title: form.title.trim(),
                description: form.description.trim(),
                severity: form.severity,
                status: form.status,
                corrective_action: form.corrective_action.trim(),
                due_date: form.due_date,
                // Resolving a violation stamps the resolution date, matching
                // `Violation.save()` in the Django model.
                resolved_date:
                  form.status === 'RESOLVED' || form.status === 'CLOSED'
                    ? new Date().toISOString().slice(0, 10)
                    : null,
              }
              if (id != null) {
                await api.updateViolation(id, payload as unknown as Partial<Violation>)
              } else {
                await api.createViolation(payload as unknown as Violation)
              }
              state.reload()
            })
          }
        >
          <div className="space-y-5">
            <Select
              label="Mine"
              required
              value={editor.sheet.form.mine}
              onChange={(e) => editor.patch({ mine: e.target.value })}
              placeholder="Select a mine"
              options={(mines.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))}
            />
            <Field
              label="Title"
              required
              value={editor.sheet.form.title}
              onChange={(e) => editor.patch({ title: e.target.value })}
              placeholder="Roof bolting not maintained at face"
            />
            <TextArea
              label="What was observed"
              required
              value={editor.sheet.form.description}
              onChange={(e) => editor.patch({ description: e.target.value })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Severity"
                value={editor.sheet.form.severity}
                onChange={(e) => editor.patch({ severity: e.target.value as Violation['severity'] })}
                options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))}
                hint={`+${({ LOW: 5, MEDIUM: 10, HIGH: 20, CRITICAL: 35 })[editor.sheet.form.severity]} points while unresolved`}
              />
              <Select
                label="Status"
                value={editor.sheet.form.status}
                onChange={(e) => editor.patch({ status: e.target.value as Violation['status'] })}
                options={(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ViolationStatus[]).map((s) => ({
                  value: s,
                  label: VIOLATION_STATUS_LABELS[s],
                }))}
              />
            </div>
            <TextArea
              label="Corrective action"
              required
              value={editor.sheet.form.corrective_action}
              onChange={(e) => editor.patch({ corrective_action: e.target.value })}
              placeholder="Re-bolt the face and re-inspect within 7 days."
            />
            <Field
              label="Closure deadline"
              type="date"
              required
              value={editor.sheet.form.due_date}
              onChange={(e) => editor.patch({ due_date: e.target.value })}
              hint="Overdue violations keep counting toward the risk score."
            />
          </div>
        </Sheet>
      )}
    </>
  )
}

function violationToForm(v: Violation): ViolationForm {
  return {
    mine: String(v.mine),
    title: v.title,
    description: v.description,
    severity: v.severity,
    status: v.status,
    corrective_action: v.corrective_action,
    due_date: v.due_date ?? '',
  }
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="py-8">{children}</div>
}

function ViolationDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const state = useAsync(() => api.listViolations(), [id])
  const row = state.data?.find((v) => v.id === id)
  if (!row) return null

  const style = RISK_STYLE[row.severity]

  return (
    <article className="sticky bottom-6 mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.28)]">
      <div className="h-1.5 w-full" style={{ backgroundColor: style.fg }} />
      <div className="p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow ink-40">
              {row.mine_name} · violation {String(row.id).padStart(5, '0')}
            </p>
            <h3 className="mt-3 text-d4 tighten-md font-normal">{row.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <SeverityTag severity={row.severity} />
            <StatusPill label={VIOLATION_STATUS_LABELS[row.status]} tone={STATUS_TONE[row.status]} />
            <PillButton size="sm" variant="outline" onClick={onClose}>
              Close
            </PillButton>
          </div>
        </div>

        <p className="mt-5 max-w-prose text-body ink-70">{row.description}</p>

        <div className="mt-7 rounded-2xl bg-card p-5">
          <p className="eyebrow ink-50">Corrective action</p>
          <p className="mt-2 text-[15px]">{row.corrective_action}</p>
        </div>

        <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="eyebrow ink-40">Raised</dt>
            <dd className="mt-1.5 text-[15px]">{formatDate(row.created_at)}</dd>
          </div>
          <div>
            <dt className="eyebrow ink-40">Due</dt>
            <dd className="mt-1.5 text-[15px]">{formatDate(row.due_date)}</dd>
          </div>
          <div>
            <dt className="eyebrow ink-40">Assigned to</dt>
            <dd className="mt-1.5 text-[15px]">{row.assigned_to_name ?? 'Unassigned'}</dd>
          </div>
          <div>
            <dt className="eyebrow ink-40">Resolved</dt>
            <dd className="mt-1.5 text-[15px]">{formatDate(row.resolved_date)}</dd>
          </div>
        </dl>

        {row.remarks && (
          <p className="mt-6 border-t border-line pt-5 text-[14px] ink-50">
            <span className="eyebrow ink-40 mr-2">Remarks</span>
            {row.remarks}
          </p>
        )}
      </div>
    </article>
  )
}