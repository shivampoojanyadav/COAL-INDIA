/* ============================================================================
   ASYNC DATA HOOKS — the smallest thing that removes the
   `useState` + `useEffect` + `try/catch` + `loading` + `error` boilerplate
   from every screen.

   Deliberately not a cache library. A 45-mine dataset is small, the mock driver
   is synchronous under the hood, and an explicit `reload()` gives screens a
   predictable refresh button. Add TanStack Query only when a real backend
   makes request dedup worth the dependency.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api'

export interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  /** True only on the very first load, so refreshes don't flash a skeleton. */
  initialLoading: boolean
  reload: () => void
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList,
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const enabled = options.enabled ?? true
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [initialLoading, setInitialLoading] = useState(enabled)
  const [nonce, setNonce] = useState(0)

  // Keep the latest callback without making it a dependency, so callers can
  // inline an async closure over props/state without causing a refetch loop.
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setInitialLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fnRef
      .current()
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please retry.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        setInitialLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, error, loading, initialLoading, reload, setData }
}

/**
 * Debounces a rapidly changing value — search boxes, date pickers.
 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}