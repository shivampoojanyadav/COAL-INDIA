import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number
  /** Margin around the root, CSS syntax. */
  rootMargin?: string
  /** Fire once and stay revealed. */
  once?: boolean
}

/**
 * The engine behind every scroll reveal: sets `data-revealed="true"` on the
 * target, which the `.mask-rise` / `.mask-fade` CSS then transitions.
 *
 * Reveal is opacity-only and fails open. If IntersectionObserver is missing, or
 * the user prefers reduced motion, the element is revealed on the first commit
 * rather than being left waiting for a callback that will never help. The CSS
 * carries a matching `@media (prefers-reduced-motion)` and `.no-js` fallback,
 * so this hook is an enhancement and never the reason content is visible.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: Options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setRevealed(false)
          }
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, revealed }
}
