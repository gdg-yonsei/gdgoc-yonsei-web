import { ViewTransition, type ReactNode } from 'react'

/**
 * Transition types a navigation can carry, and the class each one animates
 * with (site-content.css). Untyped navigations (browser back, refreshes)
 * leave the page still.
 */
export const PAGE_TRANSITIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  'generation-switch': 'crossfade',
  default: 'none',
} as const

/**
 * Slides page content left or right for `nav-forward` / `nav-back` links and
 * crossfades between generations of the same page. Layouts persist across
 * navigations, so every page wraps itself.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={PAGE_TRANSITIONS}
      exit={PAGE_TRANSITIONS}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
