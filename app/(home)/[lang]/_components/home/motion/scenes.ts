import { createScope, type Scope } from 'animejs'
import { MOTION_QUERIES, type Scene, type SceneMatches } from './scene'
import hero from './scenes/hero'
import join from './scenes/join'
import manifesto from './scenes/manifesto'
import log from './scenes/log'
import parts from './scenes/parts'
import programs from './scenes/programs'
import releases from './scenes/releases'

export type { Scene, SceneContext } from './scene'

/** The landing's scenes, keyed by each section's `data-scene`. */
const SCENES: Partial<Record<string, Scene>> = {
  hero,
  manifesto,
  programs,
  parts,
  log,
  releases,
  join,
}

/**
 * Arms each `[data-scene]` section with its scene once the section comes
 * within a screen of the viewport. Every scene runs in its own anime.js
 * scope rooted at its section, so it reverts on its own: on teardown, when
 * it throws, and whenever a motion media query flips (reduced motion turns
 * the section back into the static page).
 */
export function mountHomeScenes(
  doc: Document,
  scenes: Partial<Record<string, Scene>> = SCENES
): () => void {
  const scopes: Scope[] = []
  const armed: HTMLElement[] = []

  const arm = (section: HTMLElement) => {
    const scene = scenes[section.dataset.scene ?? '']
    if (!scene) return
    // Sections skip laying out their content until they near the viewport
    // (content-visibility: auto); a scene measures that content now.
    section.style.contentVisibility = 'visible'
    armed.push(section)
    const belowFold = (element: Element = section) =>
      element.getBoundingClientRect().top >= innerHeight

    const scope: Scope = createScope({
      root: section,
      mediaQueries: MOTION_QUERIES,
    }).add((self) => {
      const matches = self?.matches as SceneMatches | undefined
      if (!self || !matches?.motion) return

      let cleanup: void | (() => void)
      try {
        cleanup = scene({ root: section, scope: self, matches, belowFold })
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error(error)
        // Undo whatever the scene managed before it threw.
        queueMicrotask(() => scope.revert())
        return
      }

      section.dataset.motion = 'js'
      return () => {
        cleanup?.()
        delete section.dataset.motion
      }
    })
    scopes.push(scope)
  }

  // A section in range is still a screen away: arm it when the browser is
  // next idle (within 300ms), so its layout and setup stay out of scroll
  // frames.
  const hasIdle = typeof requestIdleCallback === 'function'
  const pending = new Set<number>()
  const schedule = (section: HTMLElement) => {
    const run = () => {
      pending.delete(handle)
      arm(section)
    }
    const handle = hasIdle
      ? requestIdleCallback(run, { timeout: 300 })
      : window.setTimeout(run, 0)
    pending.add(handle)
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        schedule(entry.target as HTMLElement)
      }
    },
    { rootMargin: '0px 0px 100% 0px' }
  )
  for (const section of doc.querySelectorAll<HTMLElement>('[data-scene]')) {
    observer.observe(section)
  }

  return () => {
    observer.disconnect()
    for (const handle of pending) {
      if (hasIdle) cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
    pending.clear()
    for (const scope of scopes.splice(0)) scope.revert()
    for (const section of armed.splice(0)) {
      section.style.removeProperty('content-visibility')
    }
  }
}
