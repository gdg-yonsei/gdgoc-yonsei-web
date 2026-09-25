import type { Scope } from 'animejs'

/** Media conditions every landing scope tracks; anime.js rebuilds a scope
    whenever one of them flips. */
export const MOTION_QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  fine: '(hover: hover) and (pointer: fine)',
  stack: '(min-width: 768px) and (min-height: 40rem)',
  wide: '(min-width: 1024px)',
} as const

export type SceneMatches = Record<keyof typeof MOTION_QUERIES, boolean>

export type SceneContext = {
  /** The section the scene animates; the scope is rooted here. */
  root: HTMLElement
  /** The section's anime.js scope. Instances created later (in event
      handlers) must come from methods added with `scope.add(name, fn)`, so
      reverting the scope always cleans them up. */
  scope: Scope
  matches: SceneMatches
  /** Whether an element (the section by default) is still wholly below the
      fold. Only such elements may be given entrance "from" states: nothing
      the visitor can already see ever jumps. */
  belowFold: (element?: Element) => boolean
}

/** One section's choreography. The returned function undoes whatever the
    scope does not track itself (listeners, nodes the scene created). */
export type Scene = (context: SceneContext) => void | (() => void)
