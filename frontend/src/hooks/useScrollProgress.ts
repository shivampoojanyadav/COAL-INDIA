import { useEffect, useState } from 'react'

/**
 * Document scroll progress, 0 → 1. Drives the `.scroll-track` indicator in the
 * right margin and the header's top rule. Lusion drives this from a custom
 * smooth-scroll library; a passive listener is equivalent here and does not
 * hijack native scrolling (which we deliberately keep, for a11y).
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame: number | null = null

    const compute = () => {
      frame = null
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0)
    }

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return progress
}
