import { useEffect, useState } from 'react'

/**
 * Current vertical scroll offset in pixels. Kept separate from
 * `useScrollProgress` so a consumer that only needs "have we scrolled past the
 * header?" doesn't subscribe to a normalised 0→1 value it never reads.
 */
export function useScrollY(): number {
  const [y, setY] = useState(() => (typeof window === 'undefined' ? 0 : window.scrollY))

  useEffect(() => {
    let frame: number | null = null

    const read = () => {
      frame = null
      setY(window.scrollY)
    }

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(read)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return y
}