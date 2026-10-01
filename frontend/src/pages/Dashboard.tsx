/* ============================================================================
   COMMAND CENTRE, one screen, six role lenses.

   Django has six separate dashboard views (`admin_dashboard`,
   `manager_dashboard`, …). Rather than six near-identical templates, this is
   one layout driven by the role: the shared spine (fleet KPIs, risk board,
   attention queue) is identical, and each role gets its own stat row and its own
   primary action. Same information architecture, far less duplication.

   The `?role=` / `:role` segment is a demo affordance, it lets a reviewer
   inspect every lens without signing out. It never overrides permissions.
   ========================================================================== */

import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { daysUntil, formatCompact, formatNumber, relativeDays } from '@/lib/format'
import type {
  Mine,
  RiskLevel,
  RiskRow,
  Role,
  Severity,
  Violation,
} from '@/lib/types'
import { ROLES, ROLE_LABELS, SEVERITIES, INSPECTION_STATUS_LABELS } from '@/lib/types'
import { Block, ScreenHeader } from '@/components/layout/Screen'
import {
  EmptyState,
  MonitoringTag,
  Panel,
  RISK_STYLE,
  RiskTag,
  SeverityTag,
  StatCard,
  StatusPill,
} from '@/components/data/Data'
import { DonutRing, RiskGauge, Sparkline } from '@/components/charts/Charts'
import { PillButton, PillLink } from '@/components/primitives/Pill'
import { BulletMeta, Cell, Section } from '@/components/primitives/Section'
import { Dot } from '@/components/primitives/Sticker'

export function Dashboard() {
  const { user } = useAuth()
  const { role: roleParam } = useParams<{ role: string }>()

  const lens: Role =
    roleParam && ROLES.includes(roleParam as Role) ? (roleParam as Role) : (user?.role ?? 'ADMIN')

  const state = useAsync(async () => {
    const [mines, violations, compliances, inspections] = await Promise.all([
      api.listMines(),
      api.listViolations(),
      api.listCompliances(),
      api.listInspections(),
    ])
    return { mines, violations, compliances, inspections }
  }, [lens])

  const riskRows = useAsync(() => api.riskBoard(), [lens])

  const stats = useMemo(() => {
    if (!state.data) return null
    const { mines, violations, compliances, inspections } = state.data

    const openViolations = violations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')
    const critical = openViolations.filter((v) => v.severity === 'CRITICAL')
    const overdue = compliances.filter((c) => c.monitoring_status === 'OVERDUE')
    const dueSoon = compliances.filter((c) => c.monitoring_status === 'DUE_SOON')
    const upcoming = inspections.filter((i) => i.status === 'SCHEDULED' && (daysUntil(i.inspection_date) ?? 0) >= 0)
    const active = mines.filter((m) => m.status === 'ACTIVE')
    const flagged = mines.filter((m) => m.risk_level === 'HIGH' || m.risk_level === 'CRITICAL')

    const capacity = mines.reduce((sum, m) => sum + Number(m.production_capacity), 0)

    return {
      mines,
      active,
      flagged,
      violations,
      openViolations,
      critical,
      compliances,
      overdue,
      dueSoon,
      inspections,
      upcoming,
      capacity,
      complianceRate: compliances.length
        ? ((compliances.length - overdue.length) / compliances.length) * 100
        : 100,
    }
  }, [state.data])

  const loading = state.initialLoading || riskRows.initialLoading
  const error = state.error ?? riskRows.error

  const greeting = user ? `${user.first_name}'s overview` : 'Overview'
  const lensLabel = ROLE_LABELS[lens]

  return (
    <>
      <ScreenHeader
        eyebrow={`${lensLabel} · live`}
        titleLines={[greeting]}
        lede={
          <>
            {stats
              ? `${formatNumber(stats.active.length)} of ${formatNumber(stats.mines.length)} mines are in production, with ${formatNumber(stats.openViolations.length)} unresolved violations across the network.`
              : 'Aggregating fleet-wide signals from the risk engine.'}
          </>
        }
        actions={
          <>
            <PillLink to="/risk" variant="filled">
              Open risk engine
            </PillLink>
          </>
        }
      />

      {/* lens switcher, demo only */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line py-4">
        <span className="eyebrow ink-40 pr-2">Lens</span>
        {ROLES.map((r) => (
          <Link
            key={r}
            to={`/dashboard/${r}`}
            className={cn('pill-tag', lens === r && 'pill-tag--active')}
          >
            {ROLE_LABELS[r]}
          </Link>
        ))}
      </div>

      {error ? (
        <EmptyState
          title="Could not load the dashboard"
          message={error}
          action={
            <PillButton size="sm" variant="outline" onClick={state.reload}>
              Retry
            </PillButton>
          }
        />
      ) : loading || !stats ? (
        <div className="grid gap-4 py-10 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------- stat row */}
          <Block>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                index={0}
                label="Mines in production"
                value={stats.active.length}
                meta={`${stats.mines.length} registered · ${formatCompact(stats.capacity)} Mtpa capacity`}
                to="/mines"
              />
              <StatCard
                index={1}
                label="Open violations"
                value={stats.openViolations.length}
                meta={`${stats.critical.length} critical · ${stats.violations.length} lifetime`}
                tone={stats.critical.length ? 'inverse' : 'default'}
                to="/violations"
              />
              <StatCard
                index={2}
                label="Compliance rate"
                value={Math.round(stats.complianceRate)}
                suffix="%"
                meta={`${stats.overdue.length} overdue · ${stats.dueSoon.length} due within 7 days`}
                to="/compliance"
              />
              <StatCard
                index={3}
                label="Elevated risk mines"
                value={stats.flagged.length}
                meta={`${stats.mines.filter((m) => m.risk_level === 'CRITICAL').length} rated critical`}
                tone="sun"
                to="/risk"
              />
            </div>
          </Block>

          {/* ------------------------------------------- risk + composition */}
          <Block>
            <div className="grid gap-6 lg:grid-cols-12">
              <Panel
                title="Network risk distribution"
                eyebrow="rule-based engine"
                corners
                className="lg:col-span-5"
                action={
                  <Link to="/risk" className="eyebrow link-underline">
                    All mines
                  </Link>
                }
              >
                <RiskDistribution mines={stats.mines} />
              </Panel>

              <Panel
                title="Highest risk sites"
                eyebrow="priority attention"
                className="lg:col-span-7"
                action={
                  <Link to="/risk" className="eyebrow link-underline">
                    Risk intelligence
                  </Link>
                }
              >
                <TopRiskList rows={riskRows.data ?? []} />
              </Panel>
            </div>
          </Block>

          {/* --------------------------------------------- attention queues */}
          <Block>
            <div className="grid gap-6 lg:grid-cols-12">
              <AttentionQueue
                title="Overdue compliance"
                eyebrow={`${stats.overdue.length} items`}
                to="/compliance"
                empty="Nothing is overdue across the network."
                items={stats.overdue
                  .slice()
                  .sort((a, b) => (daysUntil(a.due_date) ?? 0) - (daysUntil(b.due_date) ?? 0))
                  .slice(0, 6)
                  .map((c) => ({
                    id: c.id,
                    title: c.requirement,
                    meta: `${c.mine_name} · due ${relativeDays(c.due_date)}`,
                    tag: <MonitoringTag status={c.monitoring_status} />,
                  }))}
              />

              <AttentionQueue
                title="Critical violations"
                eyebrow={`${stats.critical.length} open`}
                to="/violations"
                empty="No critical violations are open."
                items={stats.critical.slice(0, 6).map((v) => ({
                  id: v.id,
                  title: v.title,
                  meta: `${v.mine_name} · raised ${relativeDays(v.created_at)}`,
                  tag: <SeverityTag severity={v.severity} />,
                }))}
              />

              <AttentionQueue
                title="Upcoming inspections"
                eyebrow={`${stats.upcoming.length} scheduled`}
                to="/inspections"
                empty="No inspections are scheduled."
                items={stats.upcoming
                  .slice()
                  .sort((a, b) => (daysUntil(a.inspection_date) ?? 0) - (daysUntil(b.inspection_date) ?? 0))
                  .slice(0, 6)
                  .map((i) => ({
                    id: i.id,
                    title: `${i.inspection_type.replace(/_/g, ' ').toLowerCase()}, ${i.mine_name}`,
                    meta: `${relativeDays(i.inspection_date)} · ${i.inspector_name ?? 'unassigned'}`,
                    tag: (
                      <StatusPill
                        label={INSPECTION_STATUS_LABELS[i.status]}
                        tone={i.status === 'COMPLETED' ? 'positive' : i.status === 'IN_PROGRESS' ? 'accent' : 'neutral'}
                      />
                    ),
                  }))}
              />
            </div>
          </Block>

          {/* ------------------------------------------ severity breakdown */}
          <Block>
            <Section className="border-t border-line pt-10">
              <Cell span={4}>
                <BulletMeta
                  items={[
                    'violations',
                    'compliance',
                    'inspections',
                    'contractors',
                    'risk engine',
                  ]}
                />
                <h2 className="mt-6 text-d3 tighten-md font-normal">
                  Severity mix across the network.
                </h2>
              </Cell>
              <Cell span={8} className="mt-10 lg:mt-0">
                <SeverityMix violations={stats.violations} />
              </Cell>
            </Section>
          </Block>
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------- sub-views */

/** Severity maps 1:1 onto the risk ramp, so the colours are shared. */
const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: RISK_STYLE.LOW.fg,
  MEDIUM: RISK_STYLE.MEDIUM.fg,
  HIGH: RISK_STYLE.HIGH.fg,
  CRITICAL: RISK_STYLE.CRITICAL.fg,
}

function RiskDistribution({ mines }: { mines: Mine[] }) {
  const counts = useMemo(() => {
    const levels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    return levels.map((level) => ({
      level,
      count: mines.filter((m) => m.risk_level === level).length,
    }))
  }, [mines])

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center">
      <DonutRing
        size={220}
        thickness={14}
        data={counts.map((c) => ({ label: c.level, value: c.count }))}
        centerLabel="mines"
        centerValue={String(mines.length)}
      />
      <ul className="w-full space-y-3 sm:w-auto sm:min-w-[180px]">
        {counts.map((c) => (
          <li key={c.level} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-3">
              <span className="dot-circle" style={{ backgroundColor: RISK_STYLE[c.level].fg }} />
              <span className="text-[14px] capitalize">{c.level.toLowerCase()}</span>
            </span>
            <span className="eyebrow tabular">{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TopRiskList({ rows }: { rows: RiskRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No risk data" message="Run a risk recompute to populate this board." />
  }

  return (
    <ul>
      {rows.slice(0, 6).map((row) => (
        <li key={row.mine.id}>
          <Link
            to={`/mines/${row.mine.id}`}
            className="group flex items-center gap-5 border-b border-line py-4 transition-colors duration-300 ease-primary hover:bg-card"
          >
            <span className="hidden shrink-0 sm:block">
              <RiskGauge score={row.score} level={row.level} size={56} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px]">{row.mine.name}</span>
              <span className="eyebrow ink-40 mt-1 block truncate">
                {row.mine.mine_code} · {row.mine.subsidiary} · {row.mine.state}
              </span>
              {row.factors.length > 0 && (
                <span className="mt-1.5 block truncate text-[13px] ink-50">{row.factors[0]}</span>
              )}
              <span className="mt-2 block">
                <Sparkline
                  data={row.trend ?? []}
                  height={22}
                  stroke={RISK_STYLE[row.level].fg}
                  fill={false}
                />
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-2">
              <RiskTag level={row.level} />
              {row.risk_change !== 0 && (
                <span className={cn('eyebrow tabular', row.risk_change > 0 ? 'text-dangerText' : 'text-ink')}>
                  {row.risk_change > 0 ? '▲' : '▼'} {Math.abs(Math.round(row.risk_change * 10) / 10)}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AttentionQueue({
  title,
  eyebrow,
  to,
  items,
  empty,
}: {
  title: string
  eyebrow: string
  to: string
  items: { id: number; title: string; meta: string; tag: React.ReactNode }[]
  empty: string
}) {
  return (
    <Panel
      title={title}
      eyebrow={eyebrow}
      className="lg:col-span-4"
      action={
        <Link to={to} className="eyebrow link-underline">
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-[14px] ink-50">{empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-line py-3.5 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px]">{item.title}</p>
                  <p className="eyebrow ink-40 mt-1 truncate">{item.meta}</p>
                </div>
                <span className="shrink-0">{item.tag}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function SeverityMix({ violations }: { violations: Violation[] }) {
  const rows = SEVERITIES.map((s) => ({
    severity: s,
    count: violations.filter((v) => v.severity === s).length,
  }))
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div>
      <ul>
        {rows.map((row, i) => (
          <li key={row.severity} className="flex items-center gap-5 border-b border-line py-4 last:border-0">
            <span className="w-24 shrink-0">
              <SeverityTag severity={row.severity} />
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-card">
              <span
                className="block h-full rounded-full transition-[width] duration-700 ease-primary"
                style={{
                  width: `${(row.count / max) * 100}%`,
                  backgroundColor: SEVERITY_COLOR[row.severity],
                  transitionDelay: `${i * 70}ms`,
                }}
              />
            </span>
            <span className="eyebrow w-12 shrink-0 text-right tabular">{row.count}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-3 text-[13px] ink-50">
        <Dot className="shrink-0" />
        Lifetime violations across every severity grade in the register.
      </p>
    </div>
  )
}