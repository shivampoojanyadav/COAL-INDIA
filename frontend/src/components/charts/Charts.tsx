import { useId, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { useReveal } from '@/hooks/useReveal'
import type { ChartSlice, RiskLevel } from '@/lib/types'
import { RISK_STYLE } from '../data/Data'

/* ============================================================================
   CHARTS, all hand-rolled SVG.

   No chart library: the Lusion aesthetic demands things off-the-shelf libs
   fight you on, no gridlines, no axis boxes, 1px hairlines at 10% black,
   monochrome fills with exactly one accent, and bars that grow from a
   transform-origin rather than animating height.
   ========================================================================== */

const ACCENT = '#1a2ffb'
const INK = '#000000'

/* ---------------------------------------------------------------- sparkline */

export function Sparkline({
  data,
  className,
  height = 40,
  stroke = INK,
  fill = true,
  strokeWidth = 1.5,
}: {
  data: number[]
  className?: string
  height?: number
  stroke?: string
  fill?: boolean
  strokeWidth?: number
}) {
  const id = useId()
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.2 })

  const { path, area } = useMemo(() => {
    if (data.length < 2) return { path: '', area: '' }
    const w = 100
    const h = 100
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 12) - 6
      return [x, y] as const
    })
    // Smooth with a Catmull-Rom-ish midpoint quadratic.
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const cx = (x0 + x1) / 2
      d += ` Q ${cx} ${y0} ${cx} ${(y0 + y1) / 2}`
      d += ` Q ${cx} ${y1} ${x1} ${y1}`
    }
    const a = `${d} L 100 100 L 0 100 Z`
    return { path: d, area: a }
  }, [data])

  if (!path) return <div ref={ref} className={cn('w-full', className)} style={{ height }} />

  return (
    <div ref={ref} data-revealed={revealed} className={cn('w-full', className)} style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
        className="overflow-visible"
      >
        {fill && (
          <>
            <defs>
              <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.14" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#sp-${id})`} />
          </>
        )}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: revealed ? 0 : 1,
            transition: 'stroke-dashoffset 1200ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------- bar series */

/**
 * Horizontal bars that grow from `transform-origin:left`, never an animated
 * width. Lusion's rule: no layout properties in transitions.
 */
export function BarSeries({
  data,
  className,
  colorMode = 'accent',
  formatValue,
  onSelect,
}: {
  data: ChartSlice[]
  className?: string
  colorMode?: 'accent' | 'mono' | 'risk'
  formatValue?: (v: number) => string
  onSelect?: (slice: ChartSlice) => void
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.1 })
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div ref={ref} data-revealed={revealed} className={cn('space-y-5', className)}>
      {data.map((slice, i) => {
        const pct = (slice.value / max) * 100
        const color =
          colorMode === 'mono'
            ? INK
            : colorMode === 'risk'
              ? riskColor(slice.label)
              : ACCENT
        const Tag = onSelect ? 'button' : 'div'
        return (
          <Tag
            key={slice.label}
            {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(slice) } : {})}
            className="block w-full text-left"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-body">{slice.label}</span>
              <span className="eyebrow ink-50 tabular">
                {formatValue ? formatValue(slice.value) : slice.value}
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-card">
              <span
                className="block h-2 origin-left"
                style={{
                  backgroundColor: color,
                  transform: `scaleX(${revealed ? pct / 100 : 0})`,
                  transition: `transform 800ms cubic-bezier(0.16,1,0.3,1) ${i * 60}ms`,
                }}
              />
            </div>
          </Tag>
        )
      })}
    </div>
  )
}

function riskColor(label: string): string {
  const key = label.toUpperCase() as RiskLevel
  if (key in RISK_STYLE) {
    return { LOW: '#c1ff00', MEDIUM: '#1a2ffb', HIGH: '#ff4c41', CRITICAL: '#000000' }[key]
  }
  return ACCENT
}

/* ---------------------------------------------------------------- donut ring */

export function DonutRing({
  data,
  size = 200,
  thickness = 18,
  className,
  centerLabel,
  centerValue,
  onSelect,
  activeIndex,
}: {
  data: ChartSlice[]
  size?: number
  thickness?: number
  className?: string
  centerLabel?: string
  centerValue?: string
  onSelect?: (slice: ChartSlice, index: number) => void
  activeIndex?: number
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.2 })
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r

  let offset = 0
  const segments = data.map((slice, i) => {
    const frac = total ? slice.value / total : 0
    const seg = {
      ...slice,
      index: i,
      dash: frac * c,
      offset,
      color: riskColor(slice.label),
    }
    offset += frac * c
    return seg
  })

  return (
    <div ref={ref} data-revealed={revealed} className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#0000001a"
            strokeWidth={thickness}
          />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={activeIndex === seg.index ? thickness + 6 : thickness}
              strokeDasharray={`${seg.dash} ${c - seg.dash}`}
              strokeDashoffset={-seg.offset}
              opacity={activeIndex === undefined || activeIndex === seg.index ? 1 : 0.28}
              className={onSelect ? 'cursor-pointer transition-opacity duration-300 ease-primary' : ''}
              onClick={onSelect ? () => onSelect(seg, seg.index) : undefined}
              style={{
                transition:
                  'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1), stroke-width 300ms cubic-bezier(0.4,0,0.1,1), opacity 300ms ease',
                transform: revealed ? 'none' : 'rotate(-90deg)',
              }}
            />
          ))}
        </g>
      </svg>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-d3 tighten-md tabular">{centerValue}</span>}
          {centerLabel && <span className="eyebrow ink-40 mt-2">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- risk gauge */

/** Semicircular risk gauge. Needle sweeps from 0 (left) to 100 (right). */
export function RiskGauge({
  score,
  level,
  size = 220,
  className,
  compareScore,
}: {
  score: number
  level: RiskLevel
  size?: number
  className?: string
  compareScore?: number
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.2 })
  const w = size
  const h = size * 0.62
  const stroke = 14
  const r = (w - stroke) / 2
  const clamped = Math.max(0, Math.min(100, score))
  const angle = -90 + (clamped / 100) * 180
  const rad = (angle * Math.PI) / 180
  const color = { LOW: '#c1ff00', MEDIUM: '#1a2ffb', HIGH: '#ff4c41', CRITICAL: '#000000' }[level]

  return (
    <div ref={ref} data-revealed={revealed} className={cn('relative', className)} style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h + stroke}`} role="img" aria-label={`Risk score ${score} of 100`}>
        <path
          d={`M ${stroke / 2} ${h} A ${r} ${r} 0 0 1 ${w - stroke / 2} ${h}`}
          fill="none"
          stroke="#0000001a"
          strokeWidth={stroke}
          strokeLinecap="butt"
        />
        <path
          d={`M ${stroke / 2} ${h} A ${r} ${r} 0 0 1 ${w - stroke / 2} ${h}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={revealed ? 1 - clamped / 100 : 1}
          style={{ transition: 'stroke-dashoffset 1100ms cubic-bezier(0.16,1,0.3,1)' }}
        />
        {compareScore !== undefined && (
          <line
            x1={w / 2}
            y1={stroke / 2}
            x2={w / 2}
            y2={h - r * 0.55}
            stroke="#00000033"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            transform={`rotate(${(-90 + (Math.max(0, Math.min(100, compareScore)) / 100) * 180) + 90} ${w / 2} ${h})`}
          />
        )}
        <line
          x1={w / 2}
          y1={h}
          x2={w / 2 + Math.cos(rad) * (r - stroke / 2)}
          y2={h + Math.sin(rad) * (r - stroke / 2)}
          stroke="#000000"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            transform: revealed ? 'none' : `rotate(-90deg)`,
            transformOrigin: `${w / 2}px ${h}px`,
            transition: 'transform 1100ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        <circle cx={w / 2} cy={h} r={5} fill="#000000" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-d2 tighten-md tabular">{Math.round(clamped)}</span>
        <span className="eyebrow ink-40 -mt-1">{level}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- line chart */

/** Multi-series line chart with a hairline baseline and dot markers. */
export function LineChart({
  series,
  labels,
  height = 240,
  className,
  yTicks = 4,
}: {
  series: { name: string; data: number[]; color?: string }[]
  labels: string[]
  height?: number
  className?: string
  yTicks?: number
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.15 })
  const all = series.flatMap((s) => s.data)
  const max = Math.max(...all, 1)
  const min = Math.min(...all, 0)
  const range = max - min || 1
  const padX = 8
  const padY = 12

  const xFor = (i: number, n: number) => padX + (i / Math.max(1, n - 1)) * (100 - padX * 2)
  const yFor = (v: number) => 100 - padY - ((v - min) / range) * (100 - padY * 2)

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (range / yTicks) * i).reverse()

  return (
    <div ref={ref} data-revealed={revealed} className={cn('w-full', className)}>
      <div className="flex gap-4">
        {/* y axis, mono, 40% ink, no axis line */}
        <div className="flex w-8 shrink-0 flex-col justify-between py-1 text-right">
          {ticks.map((t, i) => (
            <span key={i} className="eyebrow ink-40 tabular">
              {Math.round(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            className="overflow-visible"
            role="img"
            aria-label={series.map((s) => s.name).join(', ')}
          >
            {/* horizontal hairlines only, no vertical grid */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={0}
                x2={100}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="#0000001a"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {series.map((s) => {
              const color = s.color ?? ACCENT
              const d = s.data
                .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i, s.data.length)} ${yFor(v)}`)
                .join(' ')
              return (
                <path
                  key={s.name}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.75}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: revealed ? 0 : 1,
                    transition: `stroke-dashoffset 1200ms cubic-bezier(0.16,1,0.3,1)`,
                  }}
                />
              )
            })}

            {series.map((s) =>
              s.data.map((v, i) => (
                <circle
                  key={`${s.name}-${i}`}
                  cx={xFor(i, s.data.length)}
                  cy={yFor(v)}
                  r={1.6}
                  fill={s.color ?? ACCENT}
                  vectorEffect="non-scaling-stroke"
                  opacity={revealed ? 1 : 0}
                  style={{ transition: `opacity 400ms ease ${600 + i * 40}ms` }}
                />
              )),
            )}
          </svg>

          {/* x labels */}
          <div className="mt-2 flex justify-between">
            {labels.map((l, i) => (
              <span key={`${l}-${i}`} className="eyebrow ink-40">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* legend, mono uppercase, matching Lusion's metadata style */}
      <div className="mt-5 flex flex-wrap items-center gap-5 pl-12">
        {series.map((s) => (
          <span key={s.name} className="eyebrow ink-50 inline-flex items-center gap-2">
            <span className="h-2 w-4" style={{ backgroundColor: s.color ?? ACCENT }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- heat strip */

/** A row of risk cells, one per mine, ordered by score. Hover reveals the label. */
export function RiskHeatStrip({
  items,
  className,
  onSelect,
}: {
  items: { id: number; label: string; score: number; level: RiskLevel }[]
  className?: string
  onSelect?: (id: number) => void
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.15 })
  return (
    <div ref={ref} data-revealed={revealed} className={cn('flex gap-1', className)}>
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          title={`${item.label}, ${item.score} (${item.level})`}
          onClick={onSelect ? () => onSelect(item.id) : undefined}
          className="group relative h-12 min-w-0 flex-1 origin-bottom transition-transform duration-300 ease-primary hover:scale-105"
          style={{
            backgroundColor: riskColor(item.level),
            transform: revealed ? 'none' : 'scaleY(0)',
            transitionDelay: `${i * 30}ms`,
            transitionProperty: 'transform, background-color',
            transitionDuration: '600ms',
            transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <span className="sr-only">
            {item.label}: {item.score} {item.level}
          </span>
        </button>
      ))}
    </div>
  )
}
