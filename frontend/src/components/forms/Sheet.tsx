/* ============================================================================
   FORM SHEET, the create/edit surface used by every registry screen.

   A right-hand panel on desktop, full-bleed on mobile, drawn with the Lusion
   vocabulary: hairline border, mono eyebrow, masked display title, dot-filled
   pill CTA, and a bare cross to dismiss.

   Accessibility is not optional here, because this is the only keyboard path
   to creating records: Escape closes, focus moves into the panel on open and
   returns to the trigger on close, the page behind is inert, and the heading
   is wired to the dialog via `aria-labelledby`.
   ========================================================================== */

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { PillButton } from '@/components/primitives/Pill'
import { Dot } from '@/components/primitives/Sticker'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Sheet({
  open,
  title,
  eyebrow,
  onClose,
  onSubmit,
  submitLabel,
  deleting,
  error,
  children,
}: {
  open: boolean
  title: string
  eyebrow: string
  onClose: () => void
  onSubmit: () => void
  submitLabel: string
  deleting?: { label: string; onDelete: () => void }
  error?: string | null
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)
  const headingId = useId()

  /* Escape to dismiss, Tab cycles inside the panel. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    returnFocusTo.current = document.activeElement as HTMLElement | null

    // The page behind must not scroll or receive clicks while the sheet is up.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the first real control rather than the panel itself, so typing
    // works immediately.
    const raf = requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = previousOverflow
      returnFocusTo.current?.focus()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-overlay flex justify-end" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/25 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="animate-fade-in relative flex h-full w-full max-w-[560px] flex-col border-l border-line bg-white"
      >
        {/* ------------------------------------------------------ header */}
        <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-6">
          <div className="min-w-0">
            <p className="eyebrow ink-40">{eyebrow}</p>
            <h2 id={headingId} className="mt-3 text-d4 tighten-md font-normal">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 p-2 transition-opacity duration-200 hover:opacity-50"
          >
            <Dot />
          </button>
        </header>

        {/* ------------------------------------------------------- body */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>

          <footer className="border-t border-line px-6 py-5">
            {error && (
              <p role="alert" className="mb-4 text-[13px] text-dangerText">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              {deleting ? (
                <PillButton variant="danger" onClick={deleting.onDelete}>
                  {deleting.label}
                </PillButton>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} className="eyebrow ink-50 hover:text-ink">
                  Cancel
                </button>
                <PillButton type="submit" variant="filled">
                  {submitLabel}
                </PillButton>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ fields */

interface BaseProps {
  label: string
  hint?: string
  error?: string
  className?: string
}

export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-desc` : undefined}
        {...props}
      />
      {(hint || error) && (
        <p id={`${id}-desc`} className={cn('eyebrow mt-2', error ? 'text-dangerText' : 'ink-40')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function TextArea({
  label,
  hint,
  error,
  className,
  rows = 4,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="field resize-y"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-desc` : undefined}
        {...props}
      />
      {(hint || error) && (
        <p id={`${id}-desc`} className={cn('eyebrow mt-2', error ? 'text-dangerText' : 'ink-40')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function Select({
  label,
  hint,
  error,
  className,
  options,
  placeholder,
  ...props
}: BaseProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[]
    placeholder?: string
  }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-desc` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {(hint || error) && (
        <p id={`${id}-desc`} className={cn('eyebrow mt-2', error ? 'text-dangerText' : 'ink-40')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}