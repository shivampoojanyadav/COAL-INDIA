import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { DocumentStatus, MonitoringStatus, RiskLevel, Severity } from '@/lib/types'
import { useCountUp } from '@/hooks/useCountUp'
import { Dot } from '@/components/primitives/Sticker'

/* ============================================================================
   STATUS + SEVERITY LANGUAGE

   Risk severity uses the reference's own status colours as a fill ramp, each
   carrying #111827 text:
     LOW      -> sun   #fde047  13.5:1
     MEDIUM   -> coral #ff6b8b   6.5:1
     HIGH     -> amber #ff5e1e   5.8:1
     CRITICAL -> ink   #111827  17.7:1  <- maximum gravity

   Critical is ink rather than the danger red: ink-on-#d92d20 is 4.4:1, short
   of AA at this size. These are FILLS — as text on cream the raw accents run
   1.30-3.00:1, so nothing here is ever used as a bare text colour.
   ========================================================================== */

export const RISK_STYLE: Record<RiskLevel, { bg: string; fg: string; ring: string }> = {
  LOW: { bg: 'eco-chip--risk-low', fg: 'text-ink', ring: 'ring-[--color-risk-low]' },
  MEDIUM: { bg: 'eco-chip--risk-medium', fg: 'text-ink', ring: 'ring-[--color-risk-medium]' },
  HIGH: { bg: 'eco-chip--risk-high', fg: 'text-ink', ring: 'ring-[--color-risk-high]' },
  CRITICAL: { bg: 'eco-chip--risk-critical', fg: 'text-white', ring: 'ring-[--color-risk-critical]' },
}

export function RiskTag({ level, className }: { level: RiskLevel; className?: string }) {
  const s = RISK_STYLE[level]
  return (
    <span
      className={cn(
        'eyebrow inline-flex items-center rounded-full px-2.5 py-1',
        s.bg,
        s.fg,
        className,
      )}
    >
      {level}
    </span>
  )
}

export function SeverityTag({ severity }: { severity: Severity }) {
  const map: Record<Severity, RiskLevel> = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  }
  return <RiskTag level={map[severity]} />
}

/** Neutral pill for non-severity state (mine status, inspection status, …). */
export function StatusPill({
  label,
  tone = 'neutral',
  className,
}: {
  label: string
  tone?: 'neutral' | 'accent' | 'positive' | 'warn' | 'critical' | 'inverse'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-card text-ink',
    accent: 'bg-lime text-ink',
    positive: 'bg-sun text-ink',
    warn: 'bg-amber text-ink',
    critical: 'bg-ink text-white',
    inverse: 'bg-ink text-white',
  }
  return (
    <span className={cn('eyebrow inline-flex items-center rounded-full px-2.5 py-1', tones[tone], className)}>
      {label}
    </span>
  )
}

const MONITORING: Record<MonitoringStatus, { label: string; tone: 'positive' | 'warn' | 'critical' | 'neutral' }> = {
  COMPLETED: { label: 'Completed', tone: 'positive' },
  OVERDUE: { label: 'Overdue', tone: 'critical' },
  DUE_SOON: { label: 'Due Soon', tone: 'warn' },
  UPCOMING: { label: 'Upcoming', tone: 'neutral' },
}

export function MonitoringTag({ status }: { status: MonitoringStatus }) {
  const m = MONITORING[status]
  return <StatusPill label={m.label} tone={m.tone} />
}

/** Contractor documents share the same three-state idea but different words. */
const DOCUMENT_STATUS: Record<DocumentStatus, { label: string; tone: 'positive' | 'warn' | 'critical' }> = {
  VALID: { label: 'Valid', tone: 'positive' },
  EXPIRING: { label: 'Expiring', tone: 'warn' },
  EXPIRED: { label: 'Expired', tone: 'critical' },
}

export function DocumentTag({ status }: { status: DocumentStatus }) {
  const d = DOCUMENT_STATUS[status]
  return <StatusPill label={d.label} tone={d.tone} />
}

/* ============================================================================
   STAT CARD — the primary dashboard surface.
   All-caps accent eyebrow, count-up numeral in the display voice, optional
   sparkline, optional delta. The reference puts these on cream cards with a
   4px coloured left stripe, which is carried over.
   ========================================================================== */

export function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  meta,
  delta,
  tone = 'default',
  to,
  className,
  index = 0,
  children,
}: {
  label: string
  value: number
  suffix?: string
  decimals?: number
  meta?: string
  delta?: number
  tone?: 'default' | 'accent' | 'inverse' | 'sun' | 'amber'
  to?: string
  className?: string
  index?: number
  children?: ReactNode
}) {
  const { ref, display } = useCountUp(value, { decimals, duration: 800 + index * 60 })
  const positive = (delta ?? 0) > 0
  const negative = (delta ?? 0) < 0

  const toneClass =
    tone === 'inverse'
      ? 'bg-ink text-white'
      : tone === 'sun'
        ? 'bg-sun text-ink'
        : tone === 'amber'
          ? 'bg-amber text-ink'
          : tone === 'accent'
            ? 'bg-lime text-ink'
            : 'bg-card text-ink'

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <p className={cn('eyebrow', tone === 'default' ? 'ink-50' : 'opacity-70')}>{label}</p>
        {delta !== undefined && (
          <span
            className={cn(
              'eyebrow shrink-0',
              tone === 'default'
                ? positive
                  ? 'text-ink'
                  : negative
                    ? 'text-dangerText'
                    : 'ink-50'
                : 'opacity-90',
            )}
          >
            {positive ? '▲' : negative ? '▼' : '—'} {Math.abs(delta)}
          </span>
        )}
      </div>

      <p className="mt-4 flex items-baseline gap-1">
        <span ref={ref} className="text-d2 tabular font-display font-extrabold">
          {display}
        </span>
        {suffix && <span className="text-d4 ink-50">{suffix}</span>}
      </p>

      {meta && <p className={cn('mt-2 text-body', tone === 'default' ? 'ink-50' : 'opacity-70')}>{meta}</p>}
      {children && <div className="mt-5">{children}</div>}
    </>
  )

  /* Every tone is a filled card, so none of them needs a border to stay
     legible against the canvas — the reference's stat blocks are cream-on-
     cream and rely on the 4px left stripe instead. */
  const shell = cn(
    'group relative overflow-hidden rounded-card border border-line p-6 lg:p-7',
    toneClass,
    className,
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          shell,
          'transition-[transform,border-color] duration-200 ease-primary hover:-translate-y-0.5 hover:border-line-strong',
        )}
      >
        {body}
      </Link>
    )
  }

  return <div className={shell}>{body}</div>
}

/* ============================================================================
   PANEL — a cream card with a hairline edge, matching `.cpg-card`. The
   reference boxes its content this way rather than ruling it off with
   dividers.
   ========================================================================== */

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
  corners = false,
}: {
  title?: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  corners?: boolean
}) {
  return (
    <section className={cn('relative flex flex-col', className)}>
      {corners && (
<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <Dot className="absolute -left-2 -top-2 opacity-50" />
        <Dot className="absolute -right-2 -top-2 opacity-50" />
      </div>
      )}
      {(title || eyebrow || action) && (
        <header className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow ink-40 mb-2">{eyebrow}</p>}
            {title && <h2 className="text-d5 font-normal">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('flex-1', bodyClassName ?? 'pt-6')}>{children}</div>
    </section>
  )
}

/* ============================================================================
   EMPTY / LOADING / ERROR — the three states every data surface must handle.
   ========================================================================== */

export function EmptyState({
  title = 'Nothing here yet',
  message,
  action,
  className,
}: {
  title?: string
  message?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-20 text-center', className)}>
      <div aria-hidden="true" className="flex items-center gap-6 ink-20">
        <Dot />
        <Dot />
        <Dot />
      </div>
      <div>
        <p className="text-d5 font-semibold uppercase">{title}</p>
        {message && <p className="mx-auto mt-2 max-w-measure text-body text-muted">{message}</p>}
      </div>
      {action}
    </div>
  )
}

export function LoadingState({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  )
}

export function ErrorState({
  message = 'The request could not be completed.',
  onRetry,
  className,
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4 px-6 py-16 text-center', className)} role="alert">
      <span className="eyebrow inline-flex items-center gap-2 text-dangerText">
        <span className="dot-circle bg-danger" />
        Request failed
      </span>
      <p className="max-w-measure text-body ink-70">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="eyebrow link-underline mt-2">
          Try again
        </button>
      )}
    </div>
  )
}

/* ============================================================================
   DATA TABLE — hairline rows, mono uppercase head, no vertical rules.
   Lusion's `.dg-table` equivalent.
   ========================================================================== */

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  className?: string
  cellClassName?: string
  render: (row: T, index: number) => ReactNode
  /** Hidden below the given breakpoint to keep tables legible on mobile. */
  hideBelow?: 'sm' | 'md' | 'lg'
}

const HIDE_CLASS: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No records match the current filters.',
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
}) {
  if (rows.length === 0) {
    return <EmptyState title="No records" message={emptyMessage} />
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="dg-table min-w-[46rem]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.hideBelow && HIDE_CLASS[col.hideBelow],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    col.align === 'right' && 'text-right tabular',
                    col.align === 'center' && 'text-center',
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                    col.cellClassName,
                  )}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
