import { cn } from '@/lib/cn'

/* ============================================================================
   CHIPS & PIPS, the reference's badge vocabulary, plus the small ornament
   primitives the existing pages already call.

   Material 3 does not use die-cut clip-path badges; it uses tonal chips with a
   full pill radius. That is what `.eco-chip` reproduces. Every tone is a fill
   carrying ink text, measured between 5.80:1 and 13.26:1, except `--solid`,
   which takes white on the primary container (9.52:1).
   ========================================================================== */

export type StickerTone = 'green' | 'lime' | 'rose' | 'amber' | 'ink' | 'solid'

const toneClass: Record<StickerTone, string> = {
  green: 'eco-chip--green',
  lime: 'eco-chip--lime',
  rose: 'eco-chip--rose',
  amber: 'eco-chip--amber',
  ink: '',
  solid: 'eco-chip--solid',
}

/**
 * A status chip. `float` gives it the reference's gentle bob; it is off by
 * default because a looping animation on every chip in a dense table is noise.
 */
export function Sticker({
  children,
  tone = 'ink',
  float = false,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  tone?: StickerTone
  float?: boolean
  /** Seconds. The reference desyncs its floating badges with this. */
  delay?: number
  className?: string
}) {
  return (
    <span
      className={cn('eco-chip', toneClass[tone], float && 'animate-float-bob', className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </span>
  )
}

/** Alias kept so the status-chip call sites read correctly. */
export function StatusPip({
  children,
  tone = 'ink',
  className,
}: {
  children: React.ReactNode
  tone?: StickerTone
  className?: string
}) {
  return <span className={cn('eco-chip', toneClass[tone], className)}>{children}</span>
}

/** A small circular swatch. Geometry only, callers set the fill. */
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('dot-circle', className)} />
}

/**
 * A distributed row of pips. `count` and `hideMiddleOnMobile` are kept so the
 * existing call sites need no edit.
 */
export function PipRow({
  count = 5,
  className,
  hideMiddleOnMobile = true,
}: {
  count?: number
  className?: string
  hideMiddleOnMobile?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none flex w-full items-center justify-between text-ink', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot
          key={i}
          className={cn(
            hideMiddleOnMobile && count >= 4 && i > 0 && i < count - 1 ? 'hidden lg:block' : undefined,
          )}
        />
      ))}
    </div>
  )
}

/** Four pips pinned to the corners of the nearest positioned ancestor. */
export function PipCorners({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 z-[1] text-ink', className)}>
      <Dot className="absolute left-0 top-0" />
      <Dot className="absolute right-0 top-0" />
      <Dot className="absolute bottom-0 left-0" />
      <Dot className="absolute bottom-0 right-0" />
    </div>
  )
}