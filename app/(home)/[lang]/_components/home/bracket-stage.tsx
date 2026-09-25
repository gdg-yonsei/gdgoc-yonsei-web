'use client'

import { useEffect, useRef } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'

/**
 * Loads the WebGL halftone field once the browser is idle. The server SVG
 * brackets stay (and remain the whole experience) when WebGL2 is missing,
 * motion is reduced, or the visitor asked to save data.
 */
export default function BracketStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.closest<HTMLElement>('[data-hero]')
    if (!canvas || !hero) return
    if (!shouldLoadMotion(readMotionEnvironment())) return

    let cancelled = false
    let teardown: (() => void) | undefined

    const start = () => {
      import('./bracket-field-gl')
        .then(({ mountBracketField }) => {
          if (!cancelled) teardown = mountBracketField(canvas, hero)
        })
        // A stale or blocked chunk only costs the live field; the poster stays.
        .catch(() => {})
    }

    const hasIdle = typeof window.requestIdleCallback === 'function'
    const handle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200)

    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
      teardown?.()
    }
  }, [])

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="bracket-canvas" />
  )
}
