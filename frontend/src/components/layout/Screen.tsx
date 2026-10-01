/* ============================================================================
   SCREEN SCAFFOLD — the shared frame for every list screen.

   All eight registry screens (mines, compliance, inspections, violations,
   contractors, documents, audit, notifications) share the same anatomy:
   crosshair header, filter rail, result count, table, states. Building it once
   is what keeps the app feeling like one product instead of eight.

   Filters are declared, not hand-coded, so adding a screen is a data change.
   ========================================================================== */

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/primitives/Section'
import { PillButton } from '@/components/primitives/Pill'
import { ErrorState, LoadingState } from '@/components/data/Data'
import { FilterGlyph } from '@/components/primitives/icons'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
  options: FilterOption[]
  /** 'search' renders a text input instead of a select. */
  kind?: 'select' | 'search'
}

export function FilterRail({
  filters,
  values,
  onChange,
  onReset,
  resultCount,
  totalCount,
}: {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}) {
  const active = filters.filter((f) => values[f.key]).length

  return (
    <div className="sticky top-[72px] z-20 -mx-[var(--base-padding-x)] border-b border-line bg-white/95 px-[var(--base-padding-x)] py-4 backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filters.map((f) => (
            <label key={f.key} className="block">
              <span className="eyebrow ink-40">{f.label}</span>
              {f.kind === 'search' ? (
                <input
                  type="search"
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder="Type to filter"
                  className="field mt-1.5 h-11 w-full"
                />
              ) : (
                <select
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="field mt-1.5 h-11 w-full"
                >
                  <option value="">All</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <p className="eyebrow ink-40 whitespace-nowrap">
            <span className="text-ink tabular">{resultCount}</span>
            {resultCount !== totalCount && (
              <>
                {' '}
                of <span className="tabular">{totalCount}</span>
              </>
            )}{' '}
            records
          </p>
          {active > 0 && (
            <PillButton size="sm" variant="outline" onClick={onReset}>
              <span className="inline-flex items-center gap-2">
                <FilterGlyph size={13} />
                Clear {active}
              </span>
            </PillButton>
          )}
        </div>
      </div>
    </div>
  )
}

export function ScreenHeader({
  eyebrow,
  titleLines,
  lede,
  actions,
}: {
  eyebrow: string
  titleLines: string[]
  lede?: ReactNode
  actions?: ReactNode
}) {
  return (
    <PageHeader eyebrow={eyebrow} titleLines={titleLines} lede={lede} actions={actions} className="pt-6" />
  )
}

/** Wraps a table region with the loading / error / empty decision. */
export function ScreenBody({
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage,
  skeletonRows = 6,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
  isEmpty: boolean
  emptyMessage: string
  skeletonRows?: number
  children: ReactNode
}) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }
  if (loading) {
    return <LoadingState rows={skeletonRows} />
  }
  if (isEmpty) {
    return (
      <div className="relative py-24 text-center">
        <p className="text-lead ink-50">{emptyMessage}</p>
      </div>
    )
  }
  return <>{children}</>
}

/** Section spacing used between blocks inside a screen. */
export function Block({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('py-10', className)}>{children}</section>
}