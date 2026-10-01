/* ============================================================================
   RISK INTELLIGENCE — the differentiator. Mirrors `risk_dashboard.html`,
   `risk_detail.html` and `predict_risk`.

   Three engines are shown side by side on purpose:
     1. the rule-based score  — a faithful port of `risk_engine.py`
     2. the ML prediction     — stands in for `mines/ml/predict.py`
     3. the AI explanation    — a port of `ai_engine.generate_risk_explanation`

   Showing all three, with their disagreement made explicit, is a far stronger
   demo than a single opaque number.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { RISK_LEVELS, RISK_LEVEL_LABELS } from '@/lib/types'
import { ScreenBody, ScreenHeader } from '@/components/layout/Screen'
import { Panel, RISK_STYLE, RiskTag, StatCard } from '@/components/data/Data'
import { BarSeries, DonutRing, RiskGauge, RiskHeatStrip } from '@/components/charts/Charts'
import { PillButton } from '@/components/primitives/Pill'
import { Dot } from '@/components/primitives/Sticker'
import { SparkGlyph } from '@/components/primitives/icons'

export function Risk() {
  const navigate = useNavigate()
  const [recomputing, setRecomputing] = useState(false)
  const state = useAsync(() => api.riskBoard(), [])
  const rows = state.data ?? []

  const stats = useMemo(() => {
    const byLevel = RISK_LEVELS.map((level) => ({
      level,
      count: rows.filter((r) => r.level === level).length,
    }))
    const mean = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0
    const rising = rows.filter((r) => r.risk_change > 0).length
    const drifting = rows.filter((r) => Math.abs(r.ml_score - r.score) >= 3).length
    return { byLevel, mean, rising, drifting, total: rows.length }
  }, [rows])

  async function recompute() {
    setRecomputing(true)
    try {
      await api.recomputeRisk()
      state.reload()
    } finally {
      setRecomputing(false)
    }
  }

  return (
    <>
      <ScreenHeader
        eyebrow="Risk intelligence · predictive"
        titleLines={['Score it before', 'it happens.']}
        lede="Three independent readings of the same risk: a deterministic rule engine, a learned model, and a generated explanation. Where they disagree is where the attention goes."
        actions={
          <>
            <PillButton variant="outline" onClick={() => void recompute()} disabled={recomputing}>
              {recomputing ? 'Recomputing…' : 'Recompute all'}
            </PillButton>
          </>
        }
      />

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={rows.length === 0}
        emptyMessage="No mines are registered yet, so there is nothing to score."
      >
        <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="Mean risk score"
            value={Math.round(stats.mean * 10) / 10}
            suffix="/100"
            meta={`Across ${formatNumber(stats.total)} mines`}
          />
          <StatCard
            index={1}
            label="High or critical"
            value={stats.byLevel.filter((l) => l.level === 'HIGH' || l.level === 'CRITICAL').reduce((s, l) => s + l.count, 0)}
            tone="inverse"
            meta={`${stats.rising} trending worse than last cycle`}
          />
          <StatCard index={2} label="Model disagreement" value={stats.drifting} tone="sun" meta="Rule vs ML gap of 3 points or more" />
          <StatCard index={3} label="Critical sites" value={stats.byLevel.find((l) => l.level === 'CRITICAL')?.count ?? 0} meta="Require immediate management review" />
        </div>

        {/* --------------------------------------------------- heat strip */}
        <Panel title="Every mine, one strip" eyebrow="ordered by score" className="py-8">
          <RiskHeatStrip
            items={rows.map((r) => ({ id: r.mine.id, label: r.mine.name, score: r.score, level: r.level }))}
            onSelect={(id) => navigate(`/mines/${id}`)}
          />
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {RISK_LEVELS.map((level) => (
              <span key={level} className="flex items-center gap-2">
                <span className="dot-circle" style={{ backgroundColor: RISK_STYLE[level].fg }} />
                <span className="eyebrow ink-50">{RISK_LEVEL_LABELS[level]}</span>
              </span>
            ))}
          </div>
        </Panel>

        {/* ------------------------------------------------ distribution */}
        <div className="grid gap-6 py-8 lg:grid-cols-12">
          <Panel title="Level distribution" eyebrow="rule engine" className="lg:col-span-4" corners>
            <DonutRing
              data={stats.byLevel.map((l) => ({ label: RISK_LEVEL_LABELS[l.level], value: l.count }))}
              size={220}
              thickness={16}
              centerLabel="mines"
              centerValue={String(stats.total)}
            />
          </Panel>

          <Panel title="Score distribution" eyebrow="banded" className="lg:col-span-8">
            <BarSeries
              data={bandScores(rows.map((r) => r.score))}
              colorMode="risk"
              formatValue={(v) => `${v} mines`}
            />
          </Panel>
        </div>

        {/* -------------------------------------------------- the board */}
        <Panel title="Risk board" eyebrow="rules · ml · ai" className="py-8" bodyClassName="px-0">
          <ul>
            {rows.map((row, i) => (
              <li key={row.mine.id}>
                <Link
                  to={`/mines/${row.mine.id}`}
                  className="group grid grid-cols-12 items-center gap-4 border-b border-line py-5 transition-colors duration-300 ease-primary hover:bg-card"
                >
                  <span className="col-span-1 hidden text-right text-[13px] tabular ink-40 sm:block">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="col-span-7 sm:col-span-4 min-w-0">
                    <span className="block truncate text-[16px]">{row.mine.name}</span>
                    <span className="eyebrow ink-40 mt-1 block truncate">
                      {row.mine.mine_code} · {row.mine.state}
                    </span>
                  </span>

                  <span className="col-span-5 sm:col-span-2 hidden sm:flex justify-center">
                    <RiskGauge score={row.score} level={row.level} size={64} />
                  </span>

                  <span className="col-span-6 sm:col-span-3 min-w-0 hidden md:block">
                    {row.factors.length === 0 ? (
                      <span className="text-[13px] ink-40">No risk factors detected</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {row.factors.slice(0, 2).map((f) => (
                          <li key={f} className="truncate text-[13px] ink-60">
                            {f}
                          </li>
                        ))}
                        {row.factors.length > 2 && (
                          <li className="text-[13px] ink-40">+{row.factors.length - 2} more</li>
                        )}
                      </ul>
                    )}
                  </span>

                  <span className="col-span-3 flex justify-end gap-2">
                    <RiskTag level={row.level} />
                    <span
                      className={cn(
                        'hidden eyebrow tabular lg:inline',
                        row.risk_change > 0 ? 'text-dangerText' : row.risk_change < 0 ? 'text-ink' : 'ink-50',
                      )}
                    >
                      {row.risk_change > 0 ? '▲' : row.risk_change < 0 ? '▼' : '—'}
                      {row.risk_change !== 0 && Math.abs(row.risk_change)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <HowItWorks />
      </ScreenBody>
    </>
  )
}

/** Buckets scores into 10-point bands for the histogram. */
function bandScores(scores: number[]): { label: string; value: number }[] {
  const bands: { label: string; value: number }[] = []
  for (let lo = 0; lo < 100; lo += 10) {
    bands.push({
      label: `${lo}–${lo + 10}`,
      value: scores.filter((s) => s >= lo && s < lo + 10).length,
    })
  }
  return bands
}

function HowItWorks() {
  const rows: { title: string; body: string }[] = [
    {
      title: 'Rule engine',
      body: 'Open and in-progress violations are summed by severity — 5, 10, 20 and 35 points. Overdue compliance adds 10 each, capped at 30. Overdue inspections add 10 each, capped at 20. Expired contractor documents add 5 each, capped at 20. The total is clamped to 100.',
    },
    {
      title: 'ML prediction',
      body: 'A learned model over violation, compliance and inspection features. In the demo it applies a small, deterministic adjustment to the rule score so the two can be compared honestly; in production this column is the output of mines/ml/predict.py.',
    },
    {
      title: 'AI explanation',
      body: 'Each contributing factor is turned into a sentence, and the ML level decides which recommendation leads. Recommendations are deduplicated, so a mine with three critical violations gets one instruction, not three.',
    },
  ]

  return (
    <section className="border-t border-line py-10">
      <div className="flex items-center gap-4">
        <SparkGlyph size={22} />
        <h2 className="text-d4 tighten-md font-normal">How the score is produced</h2>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {rows.map((r, i) => (
          <div key={r.title} className="relative">
            <Dot className="mb-5" />
            <p className="eyebrow ink-40">Stage {String(i + 1).padStart(2, '0')}</p>
            <h3 className="mt-3 text-[18px] font-normal">{r.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed ink-70">{r.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}