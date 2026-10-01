/* ============================================================================
   SESSION PERSISTENCE

   The signed-in identity lives in `sessionStorage`, not `localStorage`, so
   closing the tab ends the session rather than leaving a terminal open.

   Only the user id is stored — never a token, never a role. That is
   deliberate: a role change applied in the backend must take effect on the
   next `api.me()` rather than being trusted from whatever the client cached.

   Both `AuthContext` and the mock driver in `api.ts` read this module, so the
   key and the shape have a single owner. The mock driver needs it because its
   "current user" is in-memory and therefore lost on reload.
   ========================================================================== */

export const SESSION_KEY = 'minegov.session'

export interface StoredSession {
  id: number
}

export function readSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: unknown }
    return typeof parsed.id === 'number' ? { id: parsed.id } : null
  } catch {
    return null
  }
}

export function writeSession(id: number): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id }))
  } catch {
    // Private-browsing or quota refusal: the session simply does not survive a
    // reload, which is a degraded convenience rather than a broken app.
  }
}

export function clearSession(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* no-op */
  }
}