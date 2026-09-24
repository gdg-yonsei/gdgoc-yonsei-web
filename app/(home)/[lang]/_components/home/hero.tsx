import type { CSSProperties } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink from '@/app/components/site/button-link'
import { heroCopy } from '@/lib/contents/site-copy'
import BracketStage from './bracket-stage'

const rise = (delayMs: number) =>
  ({ '--rise-delay': `${delayMs}ms` }) as CSSProperties

/**
 * "< GDGoC Yonsei >": the chapter name sits between the two GDG brackets.
 * The SVG posters paint immediately; BracketStage later swaps them for the
 * live halftone field once the browser is idle.
 */
export default function Hero({ lang }: { lang: Locale }) {
  const copy = heroCopy[lang]

  return (
    <section data-hero aria-labelledby="hero-title" className="hero">
      <BracketStage />
      <div className="hero-inner">
        <p className="hero-rise hero-eyebrow" style={rise(60)}>
          {copy.eyebrow}
        </p>
        <div className="hero-mark">
          <span data-bracket="left" className="bracket-slot">
            <span className="bracket-part">
              <BracketPoster side="left" />
            </span>
          </span>
          <h1 id="hero-title" className="hero-title">
            GDGoC <span className="hero-title-line">Yonsei</span>
          </h1>
          <span data-bracket="right" className="bracket-slot">
            <span className="bracket-part">
              <BracketPoster side="right" />
            </span>
          </span>
        </div>
        <p className="hero-rise hero-tagline" style={rise(220)}>
          {copy.tagline}
        </p>
        <div className="hero-rise hero-actions" style={rise(320)}>
          <ButtonLink href={`/${lang}/session`} tone="stageSolid">
            {copy.primaryCta}
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </ButtonLink>
          <ButtonLink href={`/${lang}/project`} tone="stageOutline">
            {copy.secondaryCta}
          </ButtonLink>
        </div>
      </div>
      <div className="hero-foot">
        <ul className="hero-meta" aria-label={copy.metaLabel}>
          {copy.meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p aria-hidden="true" className="hero-cue">
          {copy.scrollCue}
        </p>
      </div>
    </section>
  )
}
