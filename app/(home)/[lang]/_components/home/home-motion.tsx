'use client'

import { useEffect } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'

/**
 * Brings the landing to life once the browser is idle: anime.js and the
 * section scenes (./motion/scenes) arrive in their own chunk. Visitors who
 * reduce motion or save data never download it, and a failed chunk or scene
 * keeps the static page. Renders nothing.
 */
export default function HomeMotion() {
  useEffect(() => {
    if (!shouldLoadMotion(readMotionEnvironment())) return

    const html = document.documentElement
    let cancelled = false
    let teardown: (() => void) | undefined

    const start = () => {
      import('./motion/scenes')
        .then(({ mountHomeScenes }) => {
          if (cancelled) return
          teardown = mountHomeScenes(document)
          html.dataset.homeMotion = 'ready'
        })
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
      delete html.dataset.homeMotion
    }
  }, [])

  return null
}
