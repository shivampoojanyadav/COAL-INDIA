import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useReveal } from '@/hooks/useReveal'

/* ============================================================================
   MASKED REVEAL — Lusion splits every designed headline into one element per
   line so each can rise independently from below inside an overflow:hidden
   box. The `.mask-rise` class does the transform; this only supplies the
   `data-revealed` attribute and the per-line stagger delay.
   ========================================================================== */

interface MaskLinesProps {
  /** One entry per visual line. Never rely on \n — split deliberately. */
  lines: string[]
  className?: string
  lineClassName?: string
  /** Stagger between lines, ms. Lusion uses ~60ms per line. */
  stagger?: number
  threshold?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
}

/** Renders an array of strings as a stack of independently-revealing lines. */
export function MaskLines({
  lines,
  className,
  lineClassName,
  stagger = 60,
  threshold = 0.2,
  as: Tag = 'h2',
}: MaskLinesProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold })

  return (
    <div ref={ref} data-revealed={revealed} className={className}>
      {lines.map((line, i) => (
        <Tag key={`${line}-${i}`} className={lineClassName}>
          <span className="mask-rise" style={{ '--reveal-delay': `${i * stagger}ms` } as React.CSSProperties}>
            {line}
          </span>
        </Tag>
      ))}
    </div>
  )
}

/**
 * Single-element reveal with a fade. Reveal is opacity-only, so the transition
 * goes on the wrapper that actually generates a box — the previous version put
 * it on a `display:contents` child, where opacity has no effect and the reveal
 * silently did nothing.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'fade',
  threshold = 0.15,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'fade' | 'rise'
  threshold?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'span'
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold })
  const inner = variant === 'rise' ? 'mask-rise' : 'mask-fade'

  return (
    <Tag
      ref={ref as never}
      data-revealed={revealed}
      className={cn(inner, className)}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}

/**
 * Per-character reveal for the 4-em sign-off headline. Lusion wraps every glyph
 * in a `.char`/`.char-wrapper` pair inside `overflow:hidden; height:.95em` so
 * letters can rise independently.
 */
export function CharReveal({
  text,
  className,
  charClassName,
  stagger = 28,
  threshold = 0.25,
  as: Tag = 'h2',
}: {
  text: string
  className?: string
  charClassName?: string
  stagger?: number
  threshold?: number
  as?: 'h1' | 'h2' | 'p' | 'div'
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold })
  const reduced = usePrefersReducedMotion()
  const chars = useMemo(() => Array.from(text), [text])

  return (
    <Tag ref={ref as never} data-revealed={revealed} className={className} aria-label={text}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block">
        {chars.map((char, i) => (
          <span
            key={`${char}-${i}`}
            className={cn('inline-block align-bottom', charClassName)}
            style={{ overflow: 'visible' }}
          >
            <span
              className="mask-rise"
              style={{
                '--reveal-delay': reduced ? '0ms' : `${i * stagger}ms`,
                transitionDuration: reduced ? '1ms' : undefined,
              } as React.CSSProperties}
            >
              {char === ' ' ? ' ' : char}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  )
}

/** Infinite vertical roll ticker — Lusion's `-clone` marquee. */
export function Marquee({
  children,
  className,
  itemClassName,
  speedSeconds = 30,
}: {
  children: ReactNode
  className?: string
  itemClassName?: string
  speedSeconds?: number
}) {
  const track = useRef<HTMLDivElement | null>(null)

  return (
    <div className={cn('relative flex overflow-hidden', className)}>
      <div
        ref={track}
        className="marquee"
        style={{ animationDuration: `${speedSeconds}s` }}
        aria-hidden="false"
      >
        <div className={cn('flex shrink-0 items-center', itemClassName)}>{children}</div>
        <div className={cn('flex shrink-0 items-center', itemClassName)} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Odometer — Lusion's `00 00 00` preloader counter. Six `1ch` slots clipped to
 * `.75em`, each sliding on translateY. Zero-padded so the width never shifts.
 */
export function Odometer({
  value,
  digits = 6,
  className,
  suffix,
}: {
  value: number
  digits?: number
  className?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const duration = 1100
    let frame: number | null = null
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplay(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [value, reduced])

  const padded = String(Math.round(display)).padStart(digits, '0')
  const chars = padded.split('')

  return (
    <span className={cn('odometer', className)} aria-label={`${value}${suffix ?? ''}`}>
      {chars.map((char, i) => (
        <span key={i} className="odometer__digit" aria-hidden="true">
          <span
            className="odometer__strip"
            style={{ transform: `translate3d(0, ${-Number(char) * 10}%, 0)` }}
          >
            {char}
          </span>
        </span>
      ))}
      {suffix && (
        <span className="odometer__digit" style={{ width: 'auto' }} aria-hidden="true">
          <span className="odometer__strip" style={{ transform: 'none' }}>
            {suffix}
          </span>
        </span>
      )}
    </span>
  )
}
