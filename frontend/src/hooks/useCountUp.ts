import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

interface Options {
  duration?: number
  decimals?: number
  /** Start counting as soon as the element scrolls into view. */
  startOnView?: boolean
}

/**
 * requestAnimationFrame counter used by the stat cards and the preloader
 * odometer. Runs a fixed number of frames rather than a wall-clock timer so
 * it can never leave a partially-rendered value behind on unmount.
 */
export function useCountUp(target: number, options: Options = {}) {
  const { duration = 900, decimals = 0, startOnView = true } = options
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(reduced ? target : 0)
  const started = useRef(false)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }

    const node = ref.current

    if (!startOnView || !node || typeof IntersectionObserver === 'undefined') {
      run()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()

    function run() {
      if (started.current) return
      started.current = true
      const from = 0
      const delta = target - from
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // cubic-bezier(.35,0,0,1) is a near-linear ease-out; approximate with
        // a mild ease so the number decelerates like the rest of the system.
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(from + delta * eased)
        if (t < 1) {
          frame.current = requestAnimationFrame(tick)
        }
      }
      frame.current = requestAnimationFrame(tick)
    }
  }, [target, duration, startOnView, reduced])

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return {
    ref,
    value,
    display: value.toFixed(decimals),
  }
}
