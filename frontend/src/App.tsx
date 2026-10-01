/* ============================================================================
   ROUTES — mirrors `MineGov/urls.py` and `mines/urls.py` one-for-one, so the
   React app and the Django templates describe the same product.

   The only intentional divergence: `/dashboard` is a role router in React (it
   dispatches to the role's own dashboard) because there is no server-side
   request context to switch on.
   ========================================================================== */

import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Shell } from '@/components/layout/Shell'
import { RequireAuth, RequireRole } from '@/components/layout/Guards'
import {
  CAN_VIEW_ANALYTICS,
  CAN_VIEW_AUDIT,
  CAN_VIEW_COMPLIANCE,
  CAN_VIEW_CONTRACTORS,
  CAN_VIEW_INSPECTIONS,
  CAN_VIEW_MINES,
  CAN_VIEW_RISK,
  CAN_VIEW_VIOLATIONS,
  CAN_USE_ASSISTANT,
} from '@/lib/roles'

import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Mines } from '@/pages/Mines'
import { MineDetail } from '@/pages/MineDetail'
import { Compliance } from '@/pages/Compliance'
import { Inspections } from '@/pages/Inspections'
import { Violations } from '@/pages/Violations'
import { Contractors } from '@/pages/Contractors'
import { Notifications } from '@/pages/Notifications'
import { Risk } from '@/pages/Risk'
import { Analytics } from '@/pages/Analytics'
import { Assistant } from '@/pages/Assistant'
import { Audit } from '@/pages/Audit'
import { NotFound } from '@/pages/NotFound'
import { Landing } from '@/pages/Landing'

/** Sends the user to whichever dashboard matches their role. */
function RoleHome() {
  const { homeFor } = useAuth()
  return <Navigate to={homeFor} replace />
}

/**
 * Public root. Mirrors the reference: a signed-in visitor goes straight to
 * their dashboard, everyone else gets the marketing page. `/landing` stays
 * reachable either way so the public page can be linked directly.
 */
function PublicHome() {
  const { user, booting } = useAuth()
  if (booting) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route path="/dashboard" element={<RoleHome />} />
            <Route path="/dashboard/:role" element={<Dashboard />} />

            <Route
              path="/mines"
              element={
                <RequireRole roles={CAN_VIEW_MINES}>
                  <Mines />
                </RequireRole>
              }
            />
            <Route
              path="/mines/:id"
              element={
                <RequireRole roles={CAN_VIEW_MINES}>
                  <MineDetail />
                </RequireRole>
              }
            />

            <Route
              path="/compliance"
              element={
                <RequireRole roles={CAN_VIEW_COMPLIANCE}>
                  <Compliance />
                </RequireRole>
              }
            />
            <Route
              path="/inspections"
              element={
                <RequireRole roles={CAN_VIEW_INSPECTIONS}>
                  <Inspections />
                </RequireRole>
              }
            />
            <Route
              path="/violations"
              element={
                <RequireRole roles={CAN_VIEW_VIOLATIONS}>
                  <Violations />
                </RequireRole>
              }
            />

            <Route
              path="/contractors"
              element={
                <RequireRole roles={CAN_VIEW_CONTRACTORS}>
                  <Contractors />
                </RequireRole>
              }
            />

            <Route
              path="/risk"
              element={
                <RequireRole roles={CAN_VIEW_RISK}>
                  <Risk />
                </RequireRole>
              }
            />
            <Route
              path="/analytics"
              element={
                <RequireRole roles={CAN_VIEW_ANALYTICS}>
                  <Analytics />
                </RequireRole>
              }
            />
            <Route
              path="/assistant"
              element={
                <RequireRole roles={CAN_USE_ASSISTANT}>
                  <Assistant />
                </RequireRole>
              }
            />
            <Route
              path="/audit"
              element={
                <RequireRole roles={CAN_VIEW_AUDIT}>
                  <Audit />
                </RequireRole>
              }
            />

            {/* Every authenticated account has its own inbox, including
                contractors, so this screen is deliberately not role-gated. */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}