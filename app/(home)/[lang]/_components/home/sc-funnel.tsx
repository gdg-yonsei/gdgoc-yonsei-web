import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import { landingCopy } from '@/lib/contents/site-copy'

/** The 2023 Solution Challenge as narrowing brackets: every step is a
    `< >`-shaped band a little narrower than the one before. */
export default function ScFunnel({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].funnel

  return (
    // Named explicitly: not every accessibility API derives a figure's name
    // from its figcaption. The funnel renders once per page.
    <figure aria-labelledby="sc-funnel-caption" className="sc-funnel">
      <figcaption id="sc-funnel-caption" className="sc-funnel-caption">
        {copy.caption}
      </figcaption>
      <ol className="sc-funnel-steps">
        {copy.steps.map((step, index) => (
          <li
            key={step.value}
            className="sc-funnel-step"
            style={{ '--step': index } as CSSProperties}
          >
            <span className="sc-funnel-value">{step.value}</span>
            <span className="sc-funnel-label">{step.label}</span>
          </li>
        ))}
      </ol>
    </figure>
  )
}
