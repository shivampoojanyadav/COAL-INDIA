/* ============================================================================
   NOTIFICATIONS — mirrors `notifications.html`. Per-recipient, because
   `AppNotification.recipient` is a FK to the user, not a broadcast table.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDateTime, relativeDays } from '@/lib/format'
import type { AppNotification, NotificationType } from '@/lib/types'
import { NOTIFICATION_TYPE_LABELS } from '@/lib/types'
import { ScreenBody, ScreenHeader } from '@/components/layout/Screen'
import { Panel, StatCard, StatusPill } from '@/components/data/Data'
import { PillButton } from '@/components/primitives/Pill'
import { Dot } from '@/components/primitives/Sticker'
import {
  AlertGlyph,
  BellGlyph,
  CheckGlyph,
  DocGlyph,
  MineGlyph,
  ShieldGlyph,
} from '@/components/primitives/icons'

const TYPE_ICON: Record<NotificationType, typeof BellGlyph> = {
  VIOLATION: AlertGlyph,
  INSPECTION: ShieldGlyph,
  COMPLIANCE: DocGlyph,
  CONTRACTOR: DocGlyph,
  SYSTEM: MineGlyph,
}

export function Notifications() {
  const state = useAsync(() => api.listNotifications(), [])

  /**
   * Read state is held locally rather than triggering a refetch: marking one
   * alert as read shouldn't re-run four list queries, and the server call still
   * happens so the change survives a reload.
   */
  const [locallyRead, setLocallyRead] = useState<Set<number>>(new Set())

  const all = state.data ?? []

  const { unread, read } = useMemo(() => {
    const rows = all.map((n) => ({ ...n, is_read: n.is_read || locallyRead.has(n.id) }))
    return {
      unread: rows.filter((n) => !n.is_read),
      read: rows.filter((n) => n.is_read),
    }
  }, [all, locallyRead])

  function markRead(id: number) {
    setLocallyRead((prev) => new Set(prev).add(id))
    void api.markNotificationRead(id).catch(() => {
      /* optimistic — a failed write is corrected on the next load */
    })
  }

  async function markAll() {
    setLocallyRead(new Set(all.map((n) => n.id)))
    await api.markAllNotificationsRead().catch(() => undefined)
  }

  return (
    <>
      <ScreenHeader
        eyebrow="Notifications · alerts"
        titleLines={['What needs', 'you now.']}
        lede="Overdue compliance, expiring contractor documents, critical violations and scheduled risk recomputes — routed to the people who can act on them."
        actions={
          unread.length > 0 ? (
            <PillButton variant="outline" onClick={() => void markAll()}>
              <span className="inline-flex items-center gap-2">
                <CheckGlyph size={14} />
                Mark all read
              </span>
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-3">
        <StatCard index={0} label="Unread" value={unread.length} tone={unread.length ? 'inverse' : 'default'} meta="Awaiting your attention" />
        <StatCard index={1} label="Read" value={read.length} meta="Already acknowledged" />
        <StatCard
          index={2}
          label="Total"
          value={all.length}
          meta={`Latest ${all[0] ? relativeDays(all[0].created_at) : '—'}`}
        />
      </div>

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={all.length === 0}
        emptyMessage="You have no notifications. Alerts appear here when compliance slips or a violation is raised against one of your mines."
      >
        <div className="grid gap-8 pb-10 lg:grid-cols-12">
          <Panel title="Unread" eyebrow={`${unread.length} items`} className="lg:col-span-7">
            {unread.length === 0 ? (
              <p className="py-8 text-center text-[14px] ink-50">
                <Dot className="mx-auto mb-4 ink-20" />
                Everything is read.
              </p>
            ) : (
              <ul>
{unread.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={() => markRead(n.id)} />
            ))}
              </ul>
            )}
          </Panel>

          <Panel title="Earlier" eyebrow={`${read.length} items`} className="lg:col-span-5">
            {read.length === 0 ? (
              <p className="py-8 text-[14px] ink-50">Nothing read yet.</p>
            ) : (
              <ul>
                {read.map((n) => (
                  <NotificationRow key={n.id} notification={n} onRead={() => undefined} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </ScreenBody>
    </>
  )
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: AppNotification
  onRead: () => void
}) {
  const Icon = TYPE_ICON[n.notification_type] ?? BellGlyph

  return (
    <li className="border-b border-line last:border-0">
      <div className="flex items-start gap-4 py-4">
        <span
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            n.is_read ? 'bg-card' : 'bg-coral text-ink',
          )}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className={cn('text-[15px]', n.is_read ? 'ink-50' : '')}>{n.title}</p>
            <StatusPill label={NOTIFICATION_TYPE_LABELS[n.notification_type]} tone={n.is_read ? 'neutral' : 'accent'} />
          </div>
          <p className="mt-1.5 text-[14px] ink-70">{n.message}</p>
          <p className="eyebrow ink-40 mt-2">
            {formatDateTime(n.created_at)} · {relativeDays(n.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          {n.link && (
            <Link to={n.link} className="eyebrow link-underline">
              Open
            </Link>
          )}
          {!n.is_read && (
            <button type="button" onClick={onRead} className="eyebrow text-ink">
              Mark read
            </button>
          )}
        </div>
      </div>
    </li>
  )
}