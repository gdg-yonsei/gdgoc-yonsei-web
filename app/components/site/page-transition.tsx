import { ViewTransition, type ReactNode } from 'react'

const DIRECTIONAL = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
}

/**
 * Slides page content left or right when a Link carries a `nav-forward` or
 * `nav-back` transition type (site-content.css). Layouts persist across
 * navigations, so every page wraps itself.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">
      {children}
    </ViewTransition>
  )
}
