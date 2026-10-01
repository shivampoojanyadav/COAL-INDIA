/* ============================================================================
   ANALYTICS — mirrors `analytics_dashboard.html`. Fleet composition, output,
   compliance trend and violation severity over time.
   ========================================================================== */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatCompact, formatNumber } from '@/lib/format'
import type { ChartSlice } from '@/lib/types'
import { ScreenBody, ScreenHeader } from '@/components/layout/Screen'
import { Panel, StatCard } from '@/components/data/Data'
import { BarSeries, DonutRing, LineChart } from '@/components/charts/Charts'
import { BulletMeta, Cell, Section } from '@/components/primitives/Section'

const SUBSIDIARY_COLOR = [
  '#1a2ffb',
  '#c1ff00',
  '#ff4c41',
  '#8832f7',
  '#8a8f9c',
  '#071bdf',
]

export function Analytics() {
  const state = useAsync(async () => {
    const [mines, violations, compliances, inspections] = await Promise.all([
      api.listMines(),
      api.listViolations(),
      api.listCompliances(),
      api.listInspections(),
    ])
    return { mines, violations, compliances, inspections }
  }, [])

  const data = state.data

  const derived = useMemo(() => {
    if (!data) return null
    const { mines, violations, compliances, inspections } = data

    const subsidiaries = [...new Set(mines.map((m) => m.subsidiary))].sort()
    const states = [...new Set(mines.map((m) => m.state))].sort()

    const capacity = mines.reduce((s, m) => s + Number(m.production_capacity), 0)

    const bySubsidiary: ChartSlice[] = subsidiaries.map((s) => ({
      label: s,
      value: mines.filter((m) => m.subsidiary === s).length,
    }))

    const byState: ChartSlice[] = states.map((s) => ({
      label: s,
      value: mines.filter((m) => m.state === s).length,
    }))

    /* Six synthetic months, derived from the real record rather than random.
       Each bucket counts the rows whose `created_at`/`due_date` falls inside it,
       which keeps the trend honest about the data it summarises. */
    const months = lastMonths(6)
    const complianceTrend = months.map((m) => {
      const inMonth = compliances.filter((c) => inMonthOf(c.due_date, m))
      const closed = inMonth.filter((c) => c.status === 'COMPLETED').length
      return percent(closed, inMonth.length)
    })
    const violationTrend = months.map(
      (m) => violations.filter((v) => inMonthOf(v.created_at, m)).length,
    )
    const inspectionTrend = months.map(
      (m) => inspections.filter((i) => inMonthOf(i.inspection_date, m)).length,
    )

    return {
      mines,
      violations,
      compliances,
      inspections,
      subsidiaries,
      capacity,
      bySubsidiary,
      byState,
      months,
      complianceTrend,
      violationTrend,
      inspectionTrend,
      completionRate: percent(
        compliances.filter((c) => c.status === 'COMPLETED').length,
        compliances.length,
      ),
      resolutionRate: percent(
        violations.filter((v) => v.status === 'RESOLVED' || v.status === 'CLOSED').length,
        violations.length,
      ),
    }
  }, [data])

  return (
    <>
      <ScreenHeader
        eyebrow="Analytics · fleet intelligence"
        titleLines={['The network,', 'measured.']}
        lede="Composition, output and assurance trends across every subsidiary and state. Every figure is derived from the register, never estimated."
      />

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={!derived}
        emptyMessage="No data is available to analyse yet."
      >
        {derived && (
          <>
            <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard index={0} label="Mines" value={derived.mines.length} meta={`${derived.subsidiaries.length} subsidiaries`} />
              <StatCard
                index={1}
                label="Combined capacity"
                value={Math.round(derived.capacity / 1e6)}
                suffix="Mt"
                meta={formatCompact(derived.capacity) + ' tonnes per annum'}
              />
              <StatCard index={2} label="Compliance closure" value={derived.completionRate} suffix="%" meta={`${derived.compliances.length} tracked requirements`} />
              <StatCard index={3} label="Violation resolution" value={derived.resolutionRate} suffix="%" meta={`${derived.violations.length} lifetime violations`} />
            </div>

            <Section className="py-8">
              <Cell span={5}>
                <Panel title="Mines by subsidiary" eyebrow="fleet composition" corners>
                  <DonutRing
                    data={derived.bySubsidiary}
                    size={230}
                    thickness={18}
                    centerLabel="mines"
                    centerValue={String(derived.mines.length)}
                  />
                  <ul className="mt-8 space-y-2.5">
                    {derived.bySubsidiary.map((s, i) => (
                      <li key={s.label} className="flex items-center gap-3">
                        <span className="dot-circle" style={{ backgroundColor: SUBSIDIARY_COLOR[i % SUBSIDIARY_COLOR.length] }} />
                        <span className="min-w-0 flex-1 truncate text-[14px]">{s.label}</span>
                        <span className="eyebrow tabular">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </Cell>

              <Cell span={7} className="mt-8 lg:mt-0 lg:pl-8">
                <Panel title="Mines by state" eyebrow="geography">
                  <BarSeries data={derived.byState} colorMode="mono" />
                </Panel>
              </Cell>
            </Section>

            <Section className="py-8">
              <Cell span={12}>
                <Panel title="Six-month trend" eyebrow="compliance · violations · inspections">
                  <LineChart
                    labels={derived.months.map((m) => m.label)}
                    series={[
                      { name: 'Compliance closed (%)', data: derived.complianceTrend, color: '#1a2ffb' },
                      { name: 'Violations raised', data: derived.violationTrend, color: '#ff4c41' },
                      { name: 'Inspections', data: derived.inspectionTrend, color: '#c1ff00' },
                    ]}
                    height={300}
                  />
                  <div className="mt-8 flex flex-wrap gap-6 border-t border-line pt-6">
                    <LegendDot color="#1a2ffb" label="Compliance closed (%)" />
                    <LegendDot color="#ff4c41" label="Violations raised" />
                    <LegendDot color="#c1ff00" label="Inspections" />
                  </div>
                </Panel>
              </Cell>
            </Section>

            <section className="border-t border-line py-10">
              <BulletMeta items={['registry', 'assurance', 'third parties']} />
              <h2 className="mt-6 max-w-[18ch] text-d3 tighten-md font-normal">
                {formatNumber(derived.mines.length)} mines, {derived.subsidiaries.length} subsidiaries,{' '}
                {derived.byState.length} states.
              </h2>
              <p className="mt-6 max-w-measure text-lead ink-70">
                The highest-capacity sites carry the most contractor paperwork, and therefore the most
                document-expiry exposure. Cross-reference the{' '}
                <Link to="/contractors" className="link-underline text-ink">
                  contractor register
                </Link>{' '}
                against the{' '}
                <Link to="/risk" className="link-underline text-ink">
                  risk board
                </Link>{' '}
                to find where the two compound.
              </p>
            </section>
          </>
        )}
      </ScreenBody>
    </>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="dot-circle" style={{ backgroundColor: color }} />
      <span className="text-[14px] ink-70">{label}</span>
    </span>
  )
}

/* ------------------------------------------------------------ date helpers */

interface Month {
  key: string
  label: string
}

/**
 * Whole-number percentage. `formatPercent` in `format.ts` returns a formatted
 * string; the charts and stat cards need the number instead.
 */
function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

function lastMonths(count: number): Month[] {
  const out: Month[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short' }),
    })
  }
  return out
}

function inMonthOf(value: string | null | undefined, month: Month): boolean {
  if (!value) return false
  return value.slice(0, 7) === month.key
}