/* ============================================================================
   APP SHELL, sidebar + sticky topbar + scrolling content.

   Below `lg` the sidebar becomes an overlay drawer, matching Lusion's own
   full-screen menu. The drawer's scroll lock uses `useLockBodyScroll`, and the
   drawer closes on route change so a tap-through never leaves it stranded.
   ========================================================================== */

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { api } from '@/lib/api'
import type { AppNotification } from '@/lib/types'
import { PillButton } from '@/components/primitives/Pill'
import { CloseGlyph } from '@/components/primitives/icons'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Shell() {
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const { pathname } = useLocation()

  useLockBodyScroll(drawerOpen)

  // Any navigation closes the drawer.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Refresh the unread count on every route change; cheap, and keeps the bell
  // honest without a websocket.
  useEffect(() => {
    let cancelled = false
    api
      .listNotifications()
      .then((rows) => {
        if (!cancelled) setNotifications(rows)
      })
      .catch(() => {
        /* the bell simply shows zero */
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  const unread = notifications.filter((n) => !n.is_read).length

  if (!user) return null

  const signOut = () => {
    void logout()
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---- desktop rail ----
           Tinted to the low surface tone so the navigation reads as its own
           region rather than white-on-white. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] border-r border-line bg-surface-low lg:block">
        <Sidebar
          role={user.role}
          counts={{ violations: unread }}
          footer={
            <PillButton size="sm" variant="outline" onClick={signOut}>
              Sign out
            </PillButton>
          }
        />
      </aside>

      {/* ---- mobile drawer ---- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]"
          />
          <div className="absolute inset-y-0 left-0 w-[min(340px,88vw)] bg-surface-low shadow-modal">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ease-primary hover:bg-card"
              aria-label="Close navigation"
            >
              <CloseGlyph />
            </button>
            <Sidebar role={user.role} counts={{ violations: unread }} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ---- main column ---- */}
      <div className="lg:pl-[var(--sidebar-w)]">
        <Topbar
          user={user}
          unread={unread}
          onOpenMenu={() => setDrawerOpen(true)}
          onSignOut={signOut}
        />
        <main id="main" className="px-[var(--base-padding-x)] pb-24 pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}