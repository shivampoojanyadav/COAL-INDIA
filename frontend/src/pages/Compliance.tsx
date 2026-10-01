/* ============================================================================
   COMPLIANCE, mirrors `mines/compliance_list.html` and `compliance_form.html`.
   `monitoring_status` is a Django model property, recomputed by `risk.ts`; the
   screen therefore never trusts a stored value.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CAN_MANAGE_COMPLIANCE } from '@/lib/roles'
import { daysUntil, formatDate, relativeDays } from '@/lib/format'
import type { Compliance } from '@/lib/types'
import {
  COMPLIANCE_CATEGORIES,
  COMPLIANCE_CATEGORY_LABELS,
} from '@/lib/types'
import { FilterRail, ScreenBody, ScreenHeader, type FilterDef } from '@/components/layout/Screen'
import {
  DataTable,
  MonitoringTag,
  StatCard,
  StatusPill,
  type Column,
} from '@/components/data/Data'
import { DonutRing } from '@/components/charts/Charts'
import { Panel } from '@/components/data/Data'
import { PillButton } from '@/components/primitives/Pill'
import { Field, Select, Sheet, TextArea } from '@/components/forms/Sheet'
import { useSheetForm } from '@/components/forms/useSheetForm'

const CATEGORY_COLOR: Record<string, string> = {
  SAFETY: '#1a2ffb',
  ENVIRONMENT: '#c1ff00',
  PRODUCTION: '#ff4c41',
  LABOUR: '#8832f7',
  OTHER: '#8a8f9c',
}

interface ComplianceForm {
  mine: string
  requirement: string
  category: Compliance['category']
  description: string
  due_date: string
  status: Compliance['status']
  completed_date: string
}

const BLANK: ComplianceForm = {
  mine: '',
  requirement: '',
  category: 'SAFETY',
  description: '',
  due_date: '',
  status: 'PENDING',
  completed_date: '',
}

function validate(form: ComplianceForm): string | null {
  if (!form.mine) return 'Choose the mine this requirement applies to.'
  if (!form.requirement.trim()) return 'Describe the requirement.'
  if (!form.due_date) return 'A requirement needs a due date to be monitored.'
  if (form.status === 'COMPLETED' && !form.completed_date) {
    return 'Mark the completion date, or leave the requirement open.'
  }
  return null
}

export function Compliance() {
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [expanded, setExpanded] = useState<number | null>(null)
  const editor = useSheetForm<ComplianceForm>(BLANK)

  /** Every mine the requirement can be attached to, for the select. */
  const mines = useAsync(() => api.listMines(), [])

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      monitoring: params.get('monitoring') ?? '',
      category: params.get('category') ?? '',
      status: params.get('status') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)
  const state = useAsync(() => api.listCompliances(), [])

  const all = state.data ?? []

  const rows = useMemo(
    () =>
      all.filter((c) => {
        if (filters.monitoring && c.monitoring_status !== filters.monitoring) return false
        if (filters.category && c.category !== filters.category) return false
        if (filters.status && c.status !== filters.status) return false
        if (debouncedQ) {
          const hay = `${c.requirement} ${c.mine_name} ${c.description} ${c.responsible_person_name ?? ''}`.toLowerCase()
          if (!hay.includes(debouncedQ.toLowerCase())) return false
        }
        return true
      }),
    [all, filters.monitoring, filters.category, filters.status, debouncedQ],
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stats = useMemo(() => {
    const overdue = all.filter((c) => c.monitoring_status === 'OVERDUE')
    const dueSoon = all.filter((c) => c.monitoring_status === 'DUE_SOON')
    const completed = all.filter((c) => c.status === 'COMPLETED')
    return {
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      completed: completed.length,
      rate: all.length ? Math.round((completed.length / all.length) * 100) : 100,
    }
  }, [all])

  const byCategory = useMemo(
    () =>
      COMPLIANCE_CATEGORIES.map((cat) => ({
        category: cat,
        label: COMPLIANCE_CATEGORY_LABELS[cat],
        color: CATEGORY_COLOR[cat],
        value: all.filter((c) => c.category === cat).length,
      })),
    [all],
  )

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    {
      key: 'monitoring',
      label: 'Monitoring',
      options: [
        { value: 'OVERDUE', label: 'Overdue' },
        { value: 'DUE_SOON', label: 'Due within 7 days' },
        { value: 'UPCOMING', label: 'Upcoming' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      options: COMPLIANCE_CATEGORIES.map((c) => ({ value: c, label: COMPLIANCE_CATEGORY_LABELS[c] })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const editable = can(CAN_MANAGE_COMPLIANCE)

  const columns: Column<Compliance>[] = [
    {
      key: 'requirement',
      header: 'Requirement',
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate text-[15px]">{c.requirement}</p>
          <p className="eyebrow ink-40 mt-1 truncate">
            {c.mine_name} · {COMPLIANCE_CATEGORY_LABELS[c.category]}
          </p>
        </div>
      ),
    },
    {
      key: 'monitoring',
      header: 'Monitoring',
      render: (c) => <MonitoringTag status={c.monitoring_status} />,
    },
    {
      key: 'due',
      header: 'Due',
      hideBelow: 'md',
      render: (c) => (
        <div>
          <p className="text-[14px]">{formatDate(c.due_date)}</p>
          <p className="eyebrow ink-40 mt-1">{relativeDays(c.due_date)}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Responsible',
      hideBelow: 'lg',
      render: (c) => <span className="text-[14px]">{c.responsible_person_name ?? 'Unassigned'}</span>,
    },
    {
      key: 'status',
      header: 'State',
      render: (c) => (
        <StatusPill
          label={c.status === 'COMPLETED' ? 'Closed' : 'Open'}
          tone={c.status === 'COMPLETED' ? 'positive' : 'neutral'}
        />
      ),
    },
    ...(editable
      ? [
          {
            key: 'edit',
            header: '',
            align: 'right' as const,
            render: (c: Compliance) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(null)
                  editor.openEdit(c, complianceToForm(c))
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
        eyebrow="Compliance · statutory"
        titleLines={['Every obligation,', 'tracked to close.']}
        lede="Compliance requirements are held per mine and monitored against their due date. Overdue items feed directly into the risk score."
        actions={
          editable ? (
            <PillButton variant="filled" onClick={() => editor.openCreate()}>
              Add requirement
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Overdue" value={stats.overdue} tone={stats.overdue ? 'inverse' : 'default'} meta="Contributing to risk scores" />
        <StatCard index={1} label="Due within 7 days" value={stats.dueSoon} tone="sun" meta="Needs scheduling now" />
        <StatCard index={2} label="Closure rate" value={stats.rate} suffix="%" meta={`${stats.completed} of ${all.length} closed`} />
        <StatCard index={3} label="Open obligations" value={all.length - stats.completed} meta="Awaiting completion" />
      </div>

      <Panel title="Requirements by category" eyebrow="all mines" className="py-8">
        <DonutRing
          data={byCategory.map((c) => ({ label: c.label, value: c.value }))}
          size={200}
          thickness={16}
          centerLabel="requirements"
          centerValue={String(all.length)}
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {byCategory.map((c) => (
            <li key={c.category} className="flex items-center gap-3">
              <span className="dot-circle" style={{ backgroundColor: c.color }} />
              <span className="min-w-0 flex-1 truncate text-[14px]">{c.label}</span>
              <span className="eyebrow tabular">{c.value}</span>
            </li>
          ))}
        </ul>
      </Panel>

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
        emptyMessage="No compliance requirements match the current filters."
      >
        <DataTable columns={columns} rows={rows} onRowClick={(c) => setExpanded(expanded === c.id ? null : c.id)} />
        {expanded != null && <ComplianceDetail id={expanded} onClose={() => setExpanded(null)} />}
      </ScreenBody>

      {editor.sheet && (
        <Sheet
          open
          eyebrow={editor.sheet.mode === 'create' ? 'Compliance' : 'Compliance · edit'}
          title={editor.sheet.mode === 'create' ? 'Add a requirement' : 'Edit requirement'}
          onClose={editor.close}
          submitLabel={editor.sheet.mode === 'create' ? 'Add' : 'Save changes'}
          error={editor.sheet.error}
          onSubmit={() =>
            void editor.submit(validate, async (form) => {
              const id = editor.sheet?.row?.id
              const payload = {
                mine: Number(form.mine),
                requirement: form.requirement.trim(),
                category: form.category,
                description: form.description.trim(),
                due_date: form.due_date,
                status: form.status,
                completed_date: form.status === 'COMPLETED' ? form.completed_date : null,
              }
              if (id != null) {
                await api.updateCompliance(id, payload as unknown as Partial<Compliance>)
              } else {
                await api.createCompliance(payload as unknown as Compliance)
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
              label="Requirement"
              required
              value={editor.sheet.form.requirement}
              onChange={(e) => editor.patch({ requirement: e.target.value })}
              placeholder="Statutory ventilation survey"
            />
            <Select
              label="Category"
              value={editor.sheet.form.category}
              onChange={(e) => editor.patch({ category: e.target.value as Compliance['category'] })}
              options={COMPLIANCE_CATEGORIES.map((c) => ({ value: c, label: COMPLIANCE_CATEGORY_LABELS[c] }))}
            />
            <TextArea
              label="Description"
              value={editor.sheet.form.description}
              onChange={(e) => editor.patch({ description: e.target.value })}
              placeholder="What must be satisfied, by whom, and to what standard."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Due date"
                type="date"
                required
                value={editor.sheet.form.due_date}
                onChange={(e) => editor.patch({ due_date: e.target.value })}
              />
              <Select
                label="State"
                value={editor.sheet.form.status}
                onChange={(e) =>
                  editor.patch({
                    status: e.target.value as Compliance['status'],
                    completed_date: e.target.value === 'COMPLETED' ? today() : '',
                  })
                }
                options={[
                  { value: 'PENDING', label: 'Open' },
                  { value: 'COMPLETED', label: 'Closed' },
                ]}
              />
            </div>
            {editor.sheet.form.status === 'COMPLETED' && (
              <Field
                label="Completed on"
                type="date"
                required
                value={editor.sheet.form.completed_date}
                onChange={(e) => editor.patch({ completed_date: e.target.value })}
              />
            )}
            <p className="border-t border-line pt-5 text-[13px] ink-50">
              Monitoring state is derived from the due date and is recalculated on every save, so it
              can never drift out of step with the calendar.
            </p>
          </div>
        </Sheet>
      )}
    </>
  )
}

function complianceToForm(c: Compliance): ComplianceForm {
  return {
    mine: String(c.mine),
    requirement: c.requirement,
    category: c.category,
    description: c.description,
    due_date: c.due_date,
    status: c.status,
    completed_date: c.completed_date ?? '',
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function ComplianceDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const state = useAsync(() => api.listCompliances(), [id])
  const row = state.data?.find((c) => c.id === id)

  if (!row) return null
  const days = daysUntil(row.due_date)

  return (
    <div className="sticky bottom-6 mt-6 rounded-2xl border border-line bg-white p-7 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow ink-40">{row.mine_name}</p>
          <h3 className="mt-3 text-d4 tighten-md font-normal">{row.requirement}</h3>
        </div>
        <div className="flex items-center gap-3">
          <MonitoringTag status={row.monitoring_status} />
          <PillButton size="sm" variant="outline" onClick={onClose}>
            Close
          </PillButton>
        </div>
      </div>

      <p className="mt-5 max-w-prose text-body ink-70">{row.description}</p>

      <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="eyebrow ink-40">Due</dt>
          <dd className="mt-1.5 text-[15px]">{formatDate(row.due_date)}</dd>
        </div>
        <div>
          <dt className="eyebrow ink-40">Remaining</dt>
          <dd className="mt-1.5 text-[15px]">{days === null ? '—' : `${days} days`}</dd>
        </div>
        <div>
          <dt className="eyebrow ink-40">Responsible</dt>
          <dd className="mt-1.5 text-[15px]">{row.responsible_person_name ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt className="eyebrow ink-40">Completed</dt>
          <dd className="mt-1.5 text-[15px]">{formatDate(row.completed_date)}</dd>
        </div>
      </dl>
    </div>
  )
}