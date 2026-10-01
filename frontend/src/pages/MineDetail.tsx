/* ============================================================================
   MINE DETAIL, mirrors `mine_detail.html`: the identity block, live risk, and
   every record attached to that mine. This is the screen that proves the data
   layer, because all six collections converge here.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatCompact, formatDate } from '@/lib/format'
import type { Compliance, Inspection, Violation } from '@/lib/types'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_TYPE_LABELS,
  MINE_STATUS_LABELS,
  VIOLATION_STATUS_LABELS,
} from '@/lib/types'
import { ScreenBody } from '@/components/layout/Screen'
import {
  DataTable,
  EmptyState,
  MonitoringTag,
  Panel,
  SeverityTag,
  StatCard,
  StatusPill,
  type Column,
} from '@/components/data/Data'
import { LineChart, RiskGauge, Sparkline } from '@/components/charts/Charts'
import { MapPinGlyph } from '@/components/primitives/icons'

type Tab = 'overview' | 'violations' | 'compliance' | 'inspections'

export function MineDetail() {
  const { id } = useParams<{ id: string }>()
  const mineId = Number(id)
  const [tab, setTab] = useState<Tab>('overview')

  const detail = useAsync(() => api.riskDetail(mineId), [mineId], {
    enabled: Number.isFinite(mineId),
  })

  const related = useAsync(async () => {
    const [violations, compliances, inspections] = await Promise.all([
      api.listViolations({ mine: mineId }),
      api.listCompliances({ mine: mineId }),
      api.listInspections({ mine: mineId }),
    ])
    return { violations, compliances, inspections }
  }, [mineId], { enabled: Number.isFinite(mineId) })

  const mine = detail.data?.mine

  const stats = useMemo(() => {
    if (!mine || !related.data) return null
    const { violations, compliances, inspections } = related.data
    const unresolved = violations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')
    const overdue = compliances.filter((c) => c.monitoring_status === 'OVERDUE')
    return {
      unresolved: unresolved.length,
      critical: unresolved.filter((v) => v.severity === 'CRITICAL').length,
      overdue: overdue.length,
      complianceRate: compliances.length
        ? Math.round(((compliances.length - overdue.length) / compliances.length) * 100)
        : 100,
      violations: violations.length,
      compliances: compliances.length,
      inspections: inspections.length,
    }
  }, [mine, related.data])

  if (!Number.isFinite(mineId)) {
    return <EmptyState title="Unknown mine" message="That mine identifier is not valid." />
  }

  return (
    <>
      <ScreenBody
        loading={detail.initialLoading}
        error={detail.error}
        onRetry={detail.reload}
        isEmpty={!mine}
        emptyMessage="That mine is not in the register."
      >
        {mine && stats && (
          <>
            {/* ------------------------------------------------ identity */}
            <header className="border-b border-line pb-8 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-8">
                <div className="min-w-0">
                  <p className="eyebrow ink-40">{mine.mine_code}</p>
                  <h1 className="mt-5 text-d2 tighten-lg font-normal">{mine.name}</h1>
                  <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-body ink-60">
                    <span className="inline-flex items-center gap-2">
                      <MapPinGlyph size={16} />
                      {mine.location}, {mine.district}, {mine.state}
                    </span>
                    <span className="ink-30">·</span>
                    <span>{mine.subsidiary}</span>
                    <span className="ink-30">·</span>
                    <span>{mine.latitude}, {mine.longitude}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <RiskGauge score={Number(mine.risk_score)} level={mine.risk_level} size={140} />
                  <div>
                    <StatusPill
                      label={MINE_STATUS_LABELS[mine.status]}
                      tone={
                        mine.status === 'ACTIVE'
                          ? 'positive'
                          : mine.status === 'MAINTENANCE'
                            ? 'warn'
                            : 'neutral'
                      }
                    />
                    <p className="eyebrow ink-40 mt-4">Manager</p>
                    <p className="mt-1.5 text-[15px]">{mine.manager_name ?? 'Unassigned'}</p>
                    <p className="eyebrow ink-40 mt-4">Capacity</p>
                    <p className="mt-1.5 text-[15px] tabular">{formatCompact(mine.production_capacity)} t</p>
                  </div>
                </div>
              </div>
            </header>

            {/* ---------------------------------------------------- stats */}
            <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard index={0} label="Risk score" value={Number(mine.risk_score)} suffix="/100" meta={`Rated ${mine.risk_level.toLowerCase()}`} to="/risk" />
              <StatCard
                index={1}
                label="Unresolved violations"
                value={stats.unresolved}
                tone={stats.critical ? 'inverse' : 'default'}
                meta={`${stats.critical} critical`}
              />
              <StatCard index={2} label="Overdue compliance" value={stats.overdue} meta={`${stats.complianceRate}% closure rate`} />
              <StatCard index={3} label="Inspections" value={stats.inspections} meta={`${stats.violations} violations raised`} />
            </div>

            {/* ------------------------------------------------------ tabs */}
            <div className="flex flex-wrap gap-2 border-b border-line pb-4">
              {(
                [
                  ['overview', 'Overview'],
                  ['violations', `Violations (${stats.violations})`],
                  ['compliance', `Compliance (${stats.compliances})`],
                  ['inspections', `Inspections (${stats.inspections})`],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn('pill-tag', tab === key && 'pill-tag--active')}
                  aria-pressed={tab === key}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="py-10">
              {tab === 'overview' && (
                <Overview
                  history={detail.data?.history ?? []}
                  riskFactors={detail.data?.risk.factors ?? []}
                  explanations={detail.data?.ai_explanation.explanations ?? []}
                  recommendations={detail.data?.ai_explanation.recommendations ?? []}
                  mlScore={detail.data?.ml_prediction.score ?? 0}
                  ruleScore={detail.data?.risk.score ?? 0}
                />
              )}

              {tab === 'violations' && <ViolationsTable rows={related.data?.violations ?? []} />}
              {tab === 'compliance' && <ComplianceTable rows={related.data?.compliances ?? []} />}
              {tab === 'inspections' && <InspectionsTable rows={related.data?.inspections ?? []} />}
            </div>
          </>
        )}
      </ScreenBody>
    </>
  )
}

/* ----------------------------------------------------------------- tabs */

function Overview({
  history,
  riskFactors,
  explanations,
  recommendations,
  ruleScore,
  mlScore,
}: {
  history: import('@/lib/types').RiskHistory[]
  riskFactors: string[]
  explanations: string[]
  recommendations: string[]
  ruleScore: number
  mlScore: number
}) {
  const series = useMemo(() => history.map((h) => Number(h.risk_score)), [history])
  const labels = useMemo(
    () => history.map((h) => formatDate(h.recorded_at).slice(0, 6)),
    [history],
  )

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <Panel title="Risk trajectory" eyebrow="six-month history" className="lg:col-span-7">
        {series.length > 1 ? (
          <LineChart labels={labels} series={[{ name: 'Risk score', data: series }]} height={260} />
        ) : (
          <p className="py-8 text-[14px] ink-50">
            Not enough history has been recorded for this mine yet.
          </p>
        )}
      </Panel>

      <Panel title="Rule vs model" eyebrow="engine comparison" className="lg:col-span-5">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <Sparkline data={series.length > 1 ? series : [0, ruleScore]} height={54} />
            <p className="eyebrow ink-40 mt-3">Rule engine</p>
            <p className="text-d4 tabular mt-1">{ruleScore}</p>
          </div>
          <div className="text-center">
            <Sparkline data={series.length > 1 ? series : [0, mlScore]} height={54} stroke="#8832f7" />
            <p className="eyebrow ink-40 mt-3">ML model</p>
            <p className="text-d4 tabular mt-1">{mlScore}</p>
          </div>
        </div>
        <p className="mt-7 border-t border-line pt-5 text-[13px] ink-50">
          A gap of three points or more is worth investigating: the model is responding to a signal
          the deterministic rules do not capture.
        </p>
      </Panel>

      <Panel title="Contributing factors" eyebrow={`${riskFactors.length} identified`} className="lg:col-span-6">
        {riskFactors.length === 0 ? (
          <p className="py-6 text-[14px] ink-50">No risk factors are currently contributing.</p>
        ) : (
          <ul>
            {riskFactors.map((f) => (
              <li key={f} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
                  <span className="text-[15px] first-letter:uppercase">{f}</span>
                </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Generated explanation" eyebrow="ai engine" className="lg:col-span-6">
        <div className="space-y-5">
          {explanations.map((e) => (
            <p key={e} className="text-[15px] leading-relaxed">
              {e}
            </p>
          ))}
        </div>
        <div className="mt-7 border-t border-line pt-6">
          <p className="eyebrow ink-40">Recommendations</p>
          <ol className="mt-4 space-y-3">
            {recommendations.map((r, i) => (
              <li key={r} className="flex gap-4 text-[15px]">
                <span className="eyebrow ink-40 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>
    </div>
  )
}

function ViolationsTable({ rows }: { rows: Violation[] }) {
  const columns: Column<Violation>[] = [
    { key: 'title', header: 'Violation', render: (v) => <span className="text-[15px]">{v.title}</span> },
    { key: 'severity', header: 'Severity', render: (v) => <SeverityTag severity={v.severity} /> },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <StatusPill
          label={VIOLATION_STATUS_LABELS[v.status]}
          tone={v.status === 'OPEN' ? 'critical' : v.status === 'IN_PROGRESS' ? 'warn' : 'positive'}
        />
      ),
    },
    { key: 'due', header: 'Due', hideBelow: 'md', render: (v) => <span className="text-[14px]">{formatDate(v.due_date)}</span> },
  ]
  return <DataTable columns={columns} rows={rows} emptyMessage="No violations have been raised against this mine." />
}

function ComplianceTable({ rows }: { rows: Compliance[] }) {
  const columns: Column<Compliance>[] = [
    { key: 'requirement', header: 'Requirement', render: (c) => <span className="text-[15px]">{c.requirement}</span> },
    { key: 'monitoring', header: 'Monitoring', render: (c) => <MonitoringTag status={c.monitoring_status} /> },
    { key: 'due', header: 'Due', hideBelow: 'md', render: (c) => <span className="text-[14px]">{formatDate(c.due_date)}</span> },
    {
      key: 'owner',
      header: 'Responsible',
      hideBelow: 'lg',
      render: (c) => <span className="text-[14px]">{c.responsible_person_name ?? 'Unassigned'}</span>,
    },
  ]
  return <DataTable columns={columns} rows={rows} emptyMessage="No compliance requirements are registered for this mine." />
}

function InspectionsTable({ rows }: { rows: Inspection[] }) {
  const columns: Column<Inspection>[] = [
    { key: 'date', header: 'Date', render: (i) => <span className="text-[14px]">{formatDate(i.inspection_date)}</span> },
    { key: 'type', header: 'Type', render: (i) => <span className="text-[14px]">{INSPECTION_TYPE_LABELS[i.inspection_type]}</span> },
    {
      key: 'inspector',
      header: 'Inspector',
      hideBelow: 'md',
      render: (i) => <span className="text-[14px]">{i.inspector_name ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <StatusPill
          label={INSPECTION_STATUS_LABELS[i.status]}
          tone={i.status === 'COMPLETED' ? 'positive' : i.status === 'IN_PROGRESS' ? 'accent' : 'neutral'}
        />
      ),
    },
  ]
  return <DataTable columns={columns} rows={rows} emptyMessage="No inspections have been carried out at this mine." />
}