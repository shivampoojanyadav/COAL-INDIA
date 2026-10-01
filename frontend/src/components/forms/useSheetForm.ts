/* ============================================================================
   SHEET FORM STATE

   Create and edit share one screen, so they share one piece of state too. Each
   registry page owns its own field shape and passes it in as `F`; this hook
   only manages the lifecycle, open, patch, submit, close, plus the error
   surfaced in the sheet footer.
   ========================================================================== */

import { useCallback, useState } from 'react'

export interface SheetFormState<F> {
  mode: 'create' | 'edit'
  /** The row being edited, or `null` when creating. */
  row: { id: number } | null
  form: F
  error: string | null
  busy: boolean
}

export function useSheetForm<F extends object>(blank: F) {
  const [sheet, setSheet] = useState<SheetFormState<F> | null>(null)

  const openCreate = useCallback(
    (form: Partial<F> = {}) => setSheet({ mode: 'create', row: null, form: { ...blank, ...form }, error: null, busy: false }),
    [blank],
  )

  const openEdit = useCallback(
    (row: { id: number }, form: F) => setSheet({ mode: 'edit', row, form, error: null, busy: false }),
    [],
  )

  const close = useCallback(() => setSheet(null), [])

  /** Field-level update. Keys not in `F` are rejected by TypeScript. */
  const patch = useCallback((values: Partial<F>) => {
    setSheet((s) => (s ? { ...s, form: { ...s.form, ...values }, error: null } : s))
  }, [])

  /**
   * Runs `validate` before `save`. Validation failures are shown inline in the
   * sheet rather than thrown, so the user keeps whatever they typed; a driver
   * error (403 from `api.guard`, say) is shown verbatim because that is the
   * message the API chose to display.
   */
  const submit = useCallback(
    async (
      validate: (form: F) => string | null,
      save: (form: F) => Promise<void>,
    ) => {
      if (!sheet || sheet.busy) return

      const invalid = validate(sheet.form)
      if (invalid) {
        setSheet((s) => (s ? { ...s, error: invalid } : s))
        return
      }

      setSheet((s) => (s ? { ...s, busy: true, error: null } : s))
      try {
        await save(sheet.form)
        setSheet(null)
      } catch (err) {
        setSheet((s) =>
          s ? { ...s, busy: false, error: err instanceof Error ? err.message : 'Something went wrong.' } : s,
        )
      }
    },
    [sheet],
  )

  return { sheet, openCreate, openEdit, close, patch, submit }
}