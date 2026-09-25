/**
 * The landing's springs, as anime.js `spring()` parameters. site-theme.css
 * holds the same curves as `linear()` tokens (--ease-spring, -snap, -soft),
 * so CSS transitions and scripted scenes settle identically; a parity test
 * (tests/lib/motion/springs.test.ts) keeps the two in step.
 */
export const SPRINGS = {
  /** The house settle: a quick rise and a slight overshoot. */
  spring: { bounce: 0.2, duration: 700 },
  /** Lively, for small things that pop: chips, dots, glyph parts. */
  snap: { bounce: 0.35, duration: 520 },
  /** No overshoot, for large surfaces that should glide. */
  soft: { bounce: 0, duration: 900 },
} as const

export type SpringName = keyof typeof SPRINGS

/** Points per CSS `linear()` token: 41 stops trace a spring to well under
    1% while keeping the global stylesheet small. */
export const SPRING_SAMPLES = 40
