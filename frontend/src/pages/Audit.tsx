/* ============================================================================
   AUDIT TRAIL, mirrors `audit_logs.html`. Admin-only in the navigation, and
   enforced twice: `navForRole` filters the item out of the sidebar, and
   `CAN_VIEW_AUDIT` gates the route in `App.tsx`.

   The log is append-only. There is no edit or delete affordance anywhere in
   this screen, by design.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDateTime, relativeDays } from '@/lib/format'
import type { AuditLog } from '@/lib/types'
import { ScreenBody, ScreenHeader } from '@/components/layout/Screen'
import { Panel, StatCard, StatusPill } from '@/components/data/Data'
import { FilterRail, type FilterDef } from '@/components/layout/Screen'
import { Dot } from '@/components/primitives/Sticker'

const ACTION_TONE: Record<string, 'critical' | 'warn' | 'accent' | 'positive' | 'neutral'> = {
  CREATE: 'positive',
  UPDATE: 'accent',
  DELETE: 'critical',
  EXPORT: 'warn',
  LOGIN: 'neutral',
}

export function Audit() {
  const [params, setParams] = useSearchParams()
  const [limit, setLimit] = useState(40)

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      action: params.get('action') ?? '',
      model: params.get('model') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)
  const state = useAsync(() => api.listAuditLogs(), [])

  const all = state.data ?? []

  const rows = useMemo(
    () =>
      all.filter((log) => {
        if (filters.action && log.action !== filters.action) return false
        if (filters.model && log.model_name !== filters.model) return false
        if (debouncedQ) {
          const hay = `${log.user_name ?? ''} ${log.description} ${log.model_name} ${log.action}`.toLowerCase()
          if (!hay.includes(debouncedQ.toLowerCase())) return false
        }
        return true
      }),
    [all, filters.action, filters.model, debouncedQ],
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const actions = useMemo(() => [...new Set(all.map((l) => l.action))].sort(), [all])
  const models = useMemo(() => [...new Set(all.map((l) => l.model_name))].sort(), [all])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      total: all.length,
      today: all.filter((l) => l.created_at.slice(0, 10) === today).length,
      users: new Set(all.map((l) => l.user_name).filter(Boolean)).size,
      destructive: all.filter((l) => l.action === 'DELETE').length,
    }
  }, [all])

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    { key: 'action', label: 'Action', options: actions.map((a) => ({ value: a, label: a })) },
    { key: 'model', label: 'Model', options: models.map((m) => ({ value: m, label: m })) },
  ]

  const visible = rows.slice(0, limit)

  return (
    <>
      <ScreenHeader
        eyebrow="Audit trail · immutable"
        titleLines={['Every action,', 'on the record.']}
        lede="An append-only log of every create, update, delete, export and sign-in across the platform. Entries cannot be edited or removed."
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Entries" value={stats.total} meta="Retained for audit" />
        <StatCard index={1} label="Logged today" value={stats.today} meta="Since 00:00" />
        <StatCard index={2} label="Distinct actors" value={stats.users} meta="Accounts in the log" />
        <StatCard
          index={3}
          label="Deletions"
          value={stats.destructive}
          tone={stats.destructive ? 'inverse' : 'default'}
          meta="Permanent record removals"
        />
      </div>

      <FilterRail
        filters={filterDefs}
        values={filters}
        onChange={setFilter}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
        resultCount={rows.length}
        totalCount={all.length}
      />

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={rows.length === 0}
        emptyMessage="No audit entries match the current filters."
      >
        <Panel title="Log" eyebrow={`${rows.length} entries`} className="py-8">
          <ul>
            {visible.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </ul>

          {rows.length > visible.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + 40)}
                className="eyebrow link-underline"
              >
                Load {Math.min(40, rows.length - visible.length)} more
              </button>
            </div>
          )}
        </Panel>
      </ScreenBody>
    </>
  )
}

function LogRow({ log }: { log: AuditLog }) {
  return (
    <li className="flex items-start gap-4 border-b border-line py-4 last:border-0">
      <Dot className="mt-1 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill
            label={log.action}
            tone={ACTION_TONE[log.action] ?? 'neutral'}
          />
          <span className="eyebrow ink-40">{log.model_name}#{log.object_id}</span>
        </div>
        <p className="mt-2 text-[15px]">{log.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[14px]">{log.user_name ?? 'system'}</p>
        <p className={cn('eyebrow ink-40 mt-1')}>{relativeDays(log.created_at)}</p>
        <p className="eyebrow ink-40 mt-0.5">{formatDateTime(log.created_at)}</p>
      </div>
    </li>
  )
}