/* ============================================================================
   ROUTE GUARDS — the React equivalents of the decorators in
   `mines/decorators.py`.

   `RequireAuth`  → `login_required`
   `RequireRole`  → `role_required([...])`

   Note the difference from Django: a server-side decorator redirects, so the
   user never sees the protected view. We can't do that, so an unauthorised
   route renders a 403 panel instead of the screen. Same outcome, visible
   cause.
   ========================================================================== */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { DisplayTitle, Eyebrow } from '@/components/primitives/Section'
import { PillLink } from '@/components/primitives/Pill'
import { PipCorners } from '@/components/primitives/Sticker'
import { LoadingState } from '@/components/data/Data'

/** Full-bleed splash while the session is restored. */
export function BootSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-[var(--base-padding-x)]">
      <div className="w-full max-w-md">
        <Eyebrow className="mb-4">MineGov</Eyebrow>
        <LoadingState rows={3} />
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { user, booting } = useAuth()
  const location = useLocation()

  if (booting) return <BootSplash />
  if (!user) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (!roles.includes(user.role)) {
    return (
      <div className="relative">
        <PipCorners />
        <div className="py-20">
          <Eyebrow>403 — Restricted</Eyebrow>
          <div className="mt-6">
            <DisplayTitle lines={['Not available', 'for your role.']} size="d3" />
          </div>
          <p className="mt-6 max-w-measure text-lead ink-70">
            You are signed in as <strong className="font-normal text-ink">{ROLE_LABELS[user.role]}</strong>.
            This screen is limited to {roles.map((r) => ROLE_LABELS[r]).join(', ')}.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <PillLink to="/dashboard">Back to command centre</PillLink>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}