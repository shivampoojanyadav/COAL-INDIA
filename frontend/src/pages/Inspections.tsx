/* ============================================================================
   INSPECTIONS — mirrors `mines/inspection_list.html` and
   `inspection_form.html`. An inspection with findings generates violations,
   which is why `violation_count` is denormalised onto the row.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CAN_MANAGE_INSPECTIONS } from '@/lib/roles'
import { daysUntil, formatDate, relativeDays } from '@/lib/format'
import type { Inspection, InspectionStatus } from '@/lib/types'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_TYPES,
  INSPECTION_TYPE_LABELS,
} from '@/lib/types'
import { FilterRail, ScreenBody, ScreenHeader, type FilterDef } from '@/components/layout/Screen'
import {
  DataTable,
  Panel,
  StatCard,
  StatusPill,
  type Column,
} from '@/components/data/Data'
import { BarSeries } from '@/components/charts/Charts'
import { PillButton } from '@/components/primitives/Pill'
import { Field, Select, Sheet, TextArea } from '@/components/forms/Sheet'
import { useSheetForm } from '@/components/forms/useSheetForm'

interface InspectionForm {
  mine: string
  inspection_type: Inspection['inspection_type']
  inspection_date: string
  status: Inspection['status']
  findings: string
  remarks: string
}

const BLANK: InspectionForm = {
  mine: '',
  inspection_type: 'ROUTINE',
  inspection_date: '',
  status: 'SCHEDULED',
  findings: '',
  remarks: '',
}

function validate(form: InspectionForm): string | null {
  if (!form.mine) return 'Choose the mine to inspect.'
  if (!form.inspection_date) return 'An inspection needs a date.'
  if (form.status === 'COMPLETED' && !form.findings.trim()) {
    return 'A completed inspection must record what was found.'
  }
  return null
}

const STATUS_TONE: Record<InspectionStatus, 'positive' | 'accent' | 'neutral' | 'warn'> = {
  COMPLETED: 'positive',
  IN_PROGRESS: 'accent',
  SCHEDULED: 'neutral',
  CANCELLED: 'warn',
}

export function Inspections() {
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(null)
  const editor = useSheetForm<InspectionForm>(BLANK)
  const editable = can(CAN_MANAGE_INSPECTIONS)
  const mines = useAsync(() => api.listMines(), [])

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      type: params.get('type') ?? '',
      status: params.get('status') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)
  const state = useAsync(() => api.listInspections(), [])

  const all = state.data ?? []

  const rows = useMemo(
    () =>
      all.filter((i) => {
        if (filters.type && i.inspection_type !== filters.type) return false
        if (filters.status && i.status !== filters.status) return false
        if (debouncedQ) {
          const hay = `${i.mine_name} ${i.inspector_name ?? ''} ${i.findings} ${i.inspection_type}`.toLowerCase()
          if (!hay.includes(debouncedQ.toLowerCase())) return false
        }
        return true
      }),
    [all, filters.type, filters.status, debouncedQ],
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stats = useMemo(() => {
    const scheduled = all.filter((i) => i.status === 'SCHEDULED')
    const upcoming = scheduled.filter((i) => (daysUntil(i.inspection_date) ?? 0) >= 0)
    const overdue = scheduled.filter((i) => (daysUntil(i.inspection_date) ?? 0) < 0)
    const completed = all.filter((i) => i.status === 'COMPLETED')
    const withViolations = completed.filter((i) => i.violation_count > 0)
    return {
      upcoming: upcoming.length,
      overdue: overdue.length,
      completed: completed.length,
      yieldRate: completed.length ? Math.round((withViolations.length / completed.length) * 100) : 0,
    }
  }, [all])

  const typeSeries = useMemo(
    () =>
      INSPECTION_TYPES.map((t) => ({
        label: INSPECTION_TYPE_LABELS[t],
        value: all.filter((i) => i.inspection_type === t).length,
      })),
    [all],
  )

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    { key: 'type', label: 'Type', options: INSPECTION_TYPES.map((t) => ({ value: t, label: INSPECTION_TYPE_LABELS[t] })) },
    {
      key: 'status',
      label: 'Status',
      options: (Object.keys(INSPECTION_STATUS_LABELS) as InspectionStatus[]).map((s) => ({
        value: s,
        label: INSPECTION_STATUS_LABELS[s],
      })),
    },
  ]

  const columns: Column<Inspection>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (i) => (
        <div>
          <p className="text-[15px]">{formatDate(i.inspection_date)}</p>
          <p className="eyebrow ink-40 mt-1">{relativeDays(i.inspection_date)}</p>
        </div>
      ),
    },
    {
      key: 'mine',
      header: 'Mine',
      render: (i) => (
        <div className="min-w-0">
          <p className="truncate text-[15px]">{i.mine_name}</p>
          <p className="eyebrow ink-40 mt-1 truncate">{INSPECTION_TYPE_LABELS[i.inspection_type]}</p>
        </div>
      ),
    },
    {
      key: 'inspector',
      header: 'Inspector',
      hideBelow: 'md',
      render: (i) => <span className="text-[14px]">{i.inspector_name ?? '—'}</span>,
    },
    { key: 'status', header: 'Status', render: (i) => <StatusPill label={INSPECTION_STATUS_LABELS[i.status]} tone={STATUS_TONE[i.status]} /> },
    {
      key: 'violations',
      header: 'Violations',
      align: 'right',
      render: (i) => (
        <span className={i.violation_count > 0 ? 'text-[14px] font-medium text-dangerText tabular' : 'text-[14px] ink-40 tabular'}>
          {i.violation_count}
        </span>
      ),
    },
    ...(editable
      ? [
          {
            key: 'edit',
            header: '',
            align: 'right' as const,
            render: (i: Inspection) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenId(null)
                  editor.openEdit(i, inspectionToForm(i))
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
        eyebrow="Inspections · assurance"
        titleLines={['Inspect, record,', 'remediate.']}
        lede="Routine, safety, environmental, surprise and compliance inspections. A completed inspection that raises findings generates severity-weighted violations."
        actions={
          editable ? (
            <PillButton variant="filled" onClick={() => editor.openCreate()}>
              Schedule inspection
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Upcoming" value={stats.upcoming} meta="Scheduled and in the future" />
        <StatCard index={1} label="Overdue inspections" value={stats.overdue} tone={stats.overdue ? 'inverse' : 'default'} meta="Contributing to risk scores" />
        <StatCard index={2} label="Completed" value={stats.completed} meta="Findings on record" />
        <StatCard index={3} label="Finding rate" value={stats.yieldRate} suffix="%" meta="Completed inspections that raised violations" />
      </div>

      <Panel title="Inspections by type" eyebrow="all mines" className="py-8">
        <BarSeries data={typeSeries} colorMode="accent" />
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
        emptyMessage="No inspections match the current filters."
      >
        <DataTable columns={columns} rows={rows} onRowClick={(i) => setOpenId(openId === i.id ? null : i.id)} />
        {openId != null && <InspectionDetail id={openId} onClose={() => setOpenId(null)} />}
      </ScreenBody>

      {editor.sheet && (
        <Sheet
          open
          eyebrow={editor.sheet.mode === 'create' ? 'Inspections' : 'Inspections · edit'}
          title={editor.sheet.mode === 'create' ? 'Schedule an inspection' : 'Edit inspection'}
          onClose={editor.close}
          submitLabel={editor.sheet.mode === 'create' ? 'Schedule' : 'Save changes'}
          error={editor.sheet.error}
          onSubmit={() =>
            void editor.submit(validate, async (form) => {
              const id = editor.sheet?.row?.id
              const payload = {
                mine: Number(form.mine),
                inspection_type: form.inspection_type,
                inspection_date: form.inspection_date,
                status: form.status,
                findings: form.findings.trim(),
                remarks: form.remarks.trim(),
              }
              if (id != null) {
                await api.updateInspection(id, payload as unknown as Partial<Inspection>)
              } else {
                await api.createInspection(payload as unknown as Inspection)
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Type"
                value={editor.sheet.form.inspection_type}
                onChange={(e) =>
                  editor.patch({ inspection_type: e.target.value as Inspection['inspection_type'] })
                }
                options={INSPECTION_TYPES.map((t) => ({ value: t, label: INSPECTION_TYPE_LABELS[t] }))}
              />
              <Select
                label="Status"
                value={editor.sheet.form.status}
                onChange={(e) => editor.patch({ status: e.target.value as Inspection['status'] })}
                options={(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as InspectionStatus[]).map((s) => ({
                  value: s,
                  label: INSPECTION_STATUS_LABELS[s],
                }))}
              />
            </div>
            <Field
              label="Inspection date"
              type="date"
              required
              value={editor.sheet.form.inspection_date}
              onChange={(e) => editor.patch({ inspection_date: e.target.value })}
              hint="Overdue scheduled inspections feed the risk score."
            />
            <TextArea
              label="Findings"
              required={editor.sheet.form.status === 'COMPLETED'}
              value={editor.sheet.form.findings}
              onChange={(e) => editor.patch({ findings: e.target.value })}
              placeholder="Ventilation adequate; two rib cracks recorded at the 12 bord."
            />
            <TextArea
              label="Remarks"
              value={editor.sheet.form.remarks}
              onChange={(e) => editor.patch({ remarks: e.target.value })}
            />
            <p className="border-t border-line pt-5 text-[13px] ink-50">
              Findings recorded here become severity-weighted violations on the violations register.
              Closing an inspection does not close them automatically.
            </p>
          </div>
        </Sheet>
      )}
    </>
  )
}

function inspectionToForm(i: Inspection): InspectionForm {
  return {
    mine: String(i.mine),
    inspection_type: i.inspection_type,
    inspection_date: i.inspection_date,
    status: i.status,
    findings: i.findings,
    remarks: i.remarks,
  }
}

function InspectionDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const state = useAsync(() => api.listInspections(), [id])
  const row = state.data?.find((i) => i.id === id)
  if (!row) return null

  return (
    <article className="sticky bottom-6 mt-6 rounded-2xl border border-line bg-white p-7 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow ink-40">
            {INSPECTION_TYPE_LABELS[row.inspection_type]} · {row.mine_name}
          </p>
          <h3 className="mt-3 text-d4 tighten-md font-normal">{formatDate(row.inspection_date)}</h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label={INSPECTION_STATUS_LABELS[row.status]} tone={STATUS_TONE[row.status]} />
          <PillButton size="sm" variant="outline" onClick={onClose}>
            Close
          </PillButton>
        </div>
      </div>

      <div className="mt-6">
        <p className="eyebrow ink-50">Findings</p>
        <p className="mt-2 max-w-prose text-[15px]">
          {row.findings || 'No findings were recorded for this inspection.'}
        </p>
      </div>

      {row.remarks && (
        <div className="mt-5">
          <p className="eyebrow ink-50">Remarks</p>
          <p className="mt-2 max-w-prose text-[15px] ink-70">{row.remarks}</p>
        </div>
      )}

      <dl className="mt-7 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
        <div>
          <dt className="eyebrow ink-40">Inspector</dt>
          <dd className="mt-1.5 text-[15px]">{row.inspector_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="eyebrow ink-40">Violations raised</dt>
          <dd className="mt-1.5 text-[15px] tabular">{row.violation_count}</dd>
        </div>
        <div>
          <dt className="eyebrow ink-40">Logged</dt>
          <dd className="mt-1.5 text-[15px]">{formatDate(row.created_at)}</dd>
        </div>
      </dl>
    </article>
  )
}