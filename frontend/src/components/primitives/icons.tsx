import { cn } from '@/lib/cn'

/* ============================================================================
   ICON KIT, every glyph is stroke-based with `stroke-linecap:round`, exactly
   as in lusion's icon set. Width/height always mirror the viewBox. All paths
   use `currentColor` (Lusion hard-codes #000/#fff here, we improved it).
   ========================================================================== */

type IconProps = {
  className?: string
  size?: number
  strokeWidth?: number
}

const base = 'drag-none'

function Svg({
  children,
  className,
  size = 16,
  strokeWidth = 1.5,
  fill = 'none',
  viewBox = '0 0 16 16',
}: {
  children: React.ReactNode
  className?: string
  size?: number
  strokeWidth?: number
  fill?: string
  viewBox?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn(base, className)}
    >
      {children}
    </svg>
  )
}

/** 16×16 right arrow, Lusion's `M2.343 8h11.314…` */
export function ArrowRight({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M2.343 8h11.314m0 0L8.673 3.016M13.657 8l-4.984 4.984" />
    </Svg>
  )
}

export function ArrowLeft({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M8 12.243 3.757 8m0 0L8 3.757M3.757 8h8.486" />
    </Svg>
  )
}

export function ArrowUpRight({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M4 20 20 4m0 0v14.096M20 4H5.904" />
    </Svg>
  )
}

export function ArrowDown({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M8 3.757v8.486m0 0 4.243-4.243M8 12.243 3.757 8" />
    </Svg>
  )
}

export function ChevronDown({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M4 6.5 8 10.5 12 6.5" />
    </Svg>
  )
}

export function ChevronRight({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M6.5 4 10.5 8 6.5 12" />
    </Svg>
  )
}

export function Plus({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M8 3v10M3 8h10" />
    </Svg>
  )
}

export function MenuGlyph({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M2.5 5h11M2.5 11h11" />
    </Svg>
  )
}

export function CloseGlyph({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Svg>
  )
}

export function SearchGlyph({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3 3" />
    </Svg>
  )
}

export function AlertGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M12 3.5 21 19.5H3L12 3.5Z" />
      <path d="M12 9.5v4.2M12 16.6v.2" />
    </Svg>
  )
}

export function ShieldGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M12 2.75 20 6v6.1c0 4.6-3.2 8.3-8 9.15-4.8-.85-8-4.55-8-9.15V6l8-3.25Z" />
      <path d="M8.75 12.2 11 14.5l4.25-4.3" />
    </Svg>
  )
}

export function MineGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M4 20V9l4-2 4 2 4-2 4 2v11" />
      <path d="M4 20h16M9 20v-4h6v4M12 7v9" />
    </Svg>
  )
}

export function GaugeGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <path d="M12 18l4.2-5.4" />
      <circle cx="12" cy="18" r="1.2" />
    </Svg>
  )
}

export function DocGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M6 2.75h8l4.5 4.5v14H6V2.75Z" />
      <path d="M14 2.75V7.5h4.5M8.75 12h6.5M8.75 16h4.5" />
    </Svg>
  )
}

export function PeopleGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.31 2.686-6 6-6s6 2.69 6 6" />
      <path d="M16 5.2a3.25 3.25 0 0 1 0 5.6M17.5 14.4A6 6 0 0 1 21 20" />
    </Svg>
  )
}

export function SparkGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M12 2.75 14 9l6.25 2-6.25 2-2 6.25-2-6.25L3.75 11 10 9l2-6.25Z" />
    </Svg>
  )
}

export function BellGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </Svg>
  )
}

export function LogOutGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M14 4.5H5.5v15H14" />
      <path d="M18.5 12H9.75M18.5 12l-3.25-3.25M18.5 12l-3.25 3.25" />
    </Svg>
  )
}

export function MapPinGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  )
}

export function TrashGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M4 6.5h16M9 6.5V4h6v2.5M6.5 6.5 7.5 20h9l1-13.5M10 10v6M14 10v6" />
    </Svg>
  )
}

export function EditGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 6.5l3 3" />
    </Svg>
  )
}

export function SendGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" />
    </Svg>
  )
}

export function FilterGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <path d="M3.5 6h17M6.5 12h11M10 18h4" />
    </Svg>
  )
}

export function ClockGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7.25V12l3.25 2" />
    </Svg>
  )
}

export function CheckGlyph({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </Svg>
  )
}

export function LockGlyph({ className, size = 24, strokeWidth }: IconProps) {
  return (
    <Svg className={className} size={size} viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.5}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
      <path d="M8 10.5V7.75a4 4 0 0 1 8 0v2.75" />
    </Svg>
  )
}

export function PlayGlyph({ className, size = 36 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn(base, className)}
    >
      <path d="M12 9.5 27 18 12 26.5v-17Z" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      width="121"
      height="24"
      viewBox="0 0 121 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('drag-none', className)}
    >
      <path
        fill="currentColor"
        d="M4.6 1.4v21.2h5.02v-7.9h5.9V8.3h-5.9V5.6h6.3V1.4H4.6Zm15.6 0v21.2h4.94V13.9l4.1 8.7h.5l4.1-8.7v8.7h4.95V1.4h-4.7l-4.6 9.9-4.6-9.9h-4.7Zm27.2 0v21.2h4.94v-7.66h2.6c5.1 0 7.86-2.7 7.86-6.77 0-4.1-2.76-6.77-7.86-6.77h-7.54Zm4.94 3.9h2.3c3.2 0 4.66 1.5 4.66 4.27 0 2.74-1.46 4.27-4.66 4.27h-2.3V5.3Zm18.5-3.9v21.2h4.94v-7.9h5.9V8.3h-5.9V5.6h6.3V1.4h-11.24Zm16.8 0v21.2h4.94v-7.9h5.9V8.3h-5.9V5.6h6.3V1.4H87.68ZM99 1.4v21.2h5.02v-7.9h5.9V8.3h-5.9V5.6h6.3V1.4H99Zm15.9 0-6.6 21.2h5.1l1.24-4.2h6.2l1.25 4.2h5.1l-6.6-21.2h-5.69Zm-1.5 13.2 1.84-6.24 1.85 6.24h-3.69Z"
      />
    </svg>
  )
}
