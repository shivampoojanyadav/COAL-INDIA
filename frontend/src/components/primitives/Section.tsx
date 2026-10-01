import type { ElementType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useReveal } from '@/hooks/useReveal'
import { PipRow } from './Sticker'
import { ArrowRight } from './icons'

/* ============================================================================
   SECTION + PAGE FURNITURE

   The reference is a single-column stack of full-bleed bands that alternate
   cream and card, each pinned to the viewport bottom and stacked over the last
   as you scroll. The stacking is a WebGL-era flourish and cannot carry a
   dashboard, so what is kept is the part that does the visual work: the
   band alternation, the 80rem container, and the display type.
   ========================================================================== */

type Span = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export function Section({
  children,
  className,
  as: Tag = 'section',
  tone = 'canvas',
  tight = false,
}: {
  children: ReactNode
  className?: string
  as?: ElementType
  tone?: 'canvas' | 'card'
  tight?: boolean
}) {
  return (
    <Tag
      className={cn(
        'section',
        tone === 'card' ? 'section--card' : 'section--canvas',
        tight && 'py-0',
        className,
      )}
    >
      <div className="section__grid mx-auto w-full max-w-container">{children}</div>
    </Tag>
  )
}

/** Grid cell. The reference places content at deliberately off-centre spans. */
export function Cell({
  children,
  span = 12,
  start,
  className,
  as: Tag = 'div',
}: {
  children?: ReactNode
  span?: Span
  start?: Span
  className?: string
  as?: ElementType
}) {
  // `span N / span N` is not valid CSS; an explicit `start` uses the
  // `N / span M` form, otherwise a bare `span N` is enough.
  const style =
    span === 12 && !start ? undefined : { gridColumn: start ? `${start} / span ${span}` : `span ${span}` }

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  )
}

/** The 4px amber rule, the one heavy line in the reference. */
export function BleedRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('w-full', className)}>
      <span className="block h-1 w-full bg-amber" />
    </div>
  )
}

/** A hairline that bleeds to the page edges. */
export function HairlineRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('w-full', className)}>
      <span className="block h-px w-full bg-line" />
    </div>
  )
}

/**
 * Page header: an all-caps eyebrow in the accent voice, a display title, an
 * optional lede, and a right-hand action slot.
 */
export function PageHeader({
  eyebrow,
  titleLines,
  lede,
  actions,
  className,
  pipRow = false,
}: {
  eyebrow: string
  titleLines: string[]
  lede?: ReactNode
  actions?: ReactNode
  className?: string
  pipRow?: boolean
}) {
  return (
    <header className={cn('border-b border-line pb-7', className)}>
      {pipRow && (
        <div className="mb-6 hidden lg:block">
          <PipRow count={4} />
        </div>
      )}
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-3 text-primary">{eyebrow}</p>
          <DisplayTitle lines={titleLines} />
          {lede && <div className="mt-5 max-w-measure text-lead text-muted">{lede}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}

/**
 * The display headline. Syne, heavy, all-caps, leading 0.95, one revealed
 * block per line.
 */
export function DisplayTitle({
  lines,
  size = 'd2',
  className,
  align = 'left',
  tone = 'ink',
}: {
  lines: string[]
  size?: 'd1' | 'd2' | 'd3' | 'd4'
  className?: string
  align?: 'left' | 'center'
  tone?: 'ink' | 'inverse'
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.1 })
  const sizeClass =
    size === 'd1' ? 'text-d1' : size === 'd2' ? 'text-d2' : size === 'd3' ? 'text-d3' : 'text-d4'

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={cn(
        sizeClass,
        'font-display uppercase',
        align === 'center' && 'text-center',
        tone === 'inverse' ? 'text-canvas' : 'text-ink',
        className,
      )}
    >
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} className="block">
          <span
            className="mask-rise inline-block"
            style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
          >
            {line}
          </span>
        </span>
      ))}
    </div>
  )
}

/** Uppercase micro label in the accent voice. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow text-muted', className)}>{children}</p>
}

/** Bullet-joined meta line. */
export function BulletMeta({ items, className }: { items: string[]; className?: string }) {
  return (
    <p className={cn('eyebrow ink-40', className)}>
      {items.map((item) => (
        <span key={item}>
          {item}
          <span className="px-1.5 opacity-60">•</span>
        </span>
      ))}
    </p>
  )
}

/** The nav primitive. Active state is a tonal green pill, per Material 3. */
export function NavRow({
  to,
  label,
  meta,
  active,
  onClick,
}: {
  to?: string
  label: string
  meta?: string
  active?: boolean
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {meta && <span className="eyebrow mt-1 block truncate opacity-75">{meta}</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="eco-nav-row no-select"
        data-active={active}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
      >
        {body}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className="eco-nav-row no-select w-full text-left"
      data-active={active}
      onClick={onClick}
    >
      {body}
    </button>
  )
}