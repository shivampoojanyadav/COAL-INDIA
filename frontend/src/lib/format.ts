/* ============================================================================
   Formatting — mirrors Django's behaviour so numbers/dates read identically
   whichever data source is active.
   ========================================================================== */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Parse a Django ISO string or `YYYY-MM-DD` into a local Date (no TZ shift). */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (dateOnly) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, (m ?? 1) - 1, d ?? 1)
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** `12 Mar 2026` */
export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** `12 Mar` — for dense tables */
export function formatDateShort(value: string | null | undefined): string {
  const d = parseDate(value)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
}

/** `12 Mar 2026, 14:32` */
export function formatDateTime(value: string | null | undefined): string {
  const d = parseDate(value)
  if (!d) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(value)}, ${hh}:${mm}`
}

/** `3 days ago` / `in 12 days` */
export function relativeDays(value: string | null | undefined): string {
  const d = parseDate(value)
  if (!d) return '—'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0) return `in ${days} days`
  return `${Math.abs(days)} days ago`
}

export function daysUntil(value: string | null | undefined): number | null {
  const d = parseDate(value)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** 12500 → `12,500` */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US')
}

/** 1250000 → `1.25M` (used for capacity / tonnage) */
export function formatCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-US')
}

/** `42.5%` */
export function formatPercent(numerator: number, denominator: number, digits = 0): string {
  if (!denominator) return '0%'
  return `${((numerator / denominator) * 100).toFixed(digits)}%`
}

/** `78.40` from `"78.40"` */
export function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : fallback
}

/** `78.4` — trims trailing zeros for score readouts */
export function formatScore(value: number | string | null | undefined): string {
  const n = toNumber(value)
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** `+4` / `−2` / `0` — lusion avoids unicode minus for legibility */
export function formatDelta(value: number): string {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}

export function initials(first: string, last: string): string {
  const a = (first || '').trim().charAt(0)
  const b = (last || '').trim().charAt(0)
  const value = `${a}${b}`.toUpperCase()
  return value || '—'
}

export function fullName(u: { first_name?: string; last_name?: string; username?: string } | null): string {
  if (!u) return '—'
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || u.username || '—'
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}
