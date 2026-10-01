/* ============================================================================
   AUTH CONTEXT — the React-side equivalent of Django's request.user.

   The session is intentionally `sessionStorage`, not `localStorage`: closing
   the tab signs you out, which is the right behaviour for a regulator tool
   running on a shared machine. Only the user id is stored; the full record is
   re-fetched through `api.me()` on boot so a role change takes effect.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Role, User } from '@/lib/types'
import { ApiError, api, setCurrentUser } from '@/lib/api'
import { HOME_FOR_ROLE, hasRole } from '@/lib/roles'

import { readSession, writeSession, clearSession } from '@/lib/session'

interface AuthState {
  user: User | null
  booting: boolean
  error: string | null
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
  can(allowed: Role[]): boolean
  homeFor: string
}

const AuthContext = createContext<AuthState | null>(null)

function readStoredUserId(): number | null {
  const s = readSession()
  return s?.id ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Restore an existing session, if the driver still recognises it.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (readStoredUserId() === null) {
        setBooting(false)
        return
      }
      try {
        const restored = await api.me()
        if (cancelled) return
        setUser(restored)
        setCurrentUser(restored)
      } catch {
        // Stale or revoked session — fall back to the login screen.
        clearSession()
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    try {
      const authenticated = await api.authenticate(username, password)
      setUser(authenticated)
      setCurrentUser(authenticated)
      try {
        writeSession(authenticated.id)
      } catch {
        /* private-mode browsers simply won't remember the session */
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while signing in. Please try again.'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // Never block a sign-out on a network failure.
    }
    setUser(null)
    setCurrentUser(null)
    setError(null)
    clearSession()
  }, [])

  const can = useCallback(
    (allowed: Role[]) => hasRole(user?.role ?? null, allowed),
    [user?.role],
  )

  const value = useMemo<AuthState>(
    () => ({
      user,
      booting,
      error,
      login,
      logout,
      can,
      homeFor: user ? HOME_FOR_ROLE[user.role] : '/login',
    }),
    [user, booting, error, login, logout, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.')
  return ctx
}