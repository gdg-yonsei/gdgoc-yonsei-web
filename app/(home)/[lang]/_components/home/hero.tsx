import type { CSSProperties, ReactNode } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink from '@/app/components/site/button-link'
import { heroCopy } from '@/lib/contents/site-copy'
import { countLabel } from '@/lib/site/format'
import BracketStage from './bracket-stage'

const rise = (delayMs: number) =>
  ({ '--rise-delay': `${delayMs}ms` }) as CSSProperties

export type HeroCounts = {
  sessions: number
  projects: number
  generations: number
}

/** The mono meta strip. Without counts it holds fixed-width placeholders. */
export function HeroMetaList({
  lang,
  counts,
}: {
  lang: Locale
  counts?: HeroCounts
}) {
  const copy = heroCopy[lang]
  const items = counts
    ? [
        countLabel(counts.sessions, copy.sessionsOne, copy.sessionsMany),
        countLabel(counts.projects, copy.projectsOne, copy.projectsMany),
        countLabel(
          counts.generations,
          copy.generationsOne,
          copy.generationsMany
        ),
      ]
    : [null, null, null]

  return (
    <ul className="hero-meta" aria-label={copy.metaLabel}>
      {items.map((item, index) =>
        item ? (
          <li key={index}>{item}</li>
        ) : (
          <li key={index} aria-hidden="true">
            <span className="hero-meta-skeleton" />
          </li>
        )
      )}
      <li>{copy.schedule}</li>
    </ul>
  )
}

/**
 * "< GDGoC Yonsei >": the chapter name sits between the two GDG brackets.
 * The SVG posters paint immediately; BracketStage later swaps them for the
 * live halftone field once the browser is idle.
 */
export default function Hero({
  lang,
  meta,
}: {
  lang: Locale
  meta?: ReactNode
}) {
  const copy = heroCopy[lang]

  return (
    <section
      data-hero
      data-scene="hero"
      aria-labelledby="hero-title"
      className="hero"
    >
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
            <span className="hero-word">GDGoC</span>{' '}
            <span className="hero-word hero-title-line">Yonsei</span>
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
        {meta ?? <HeroMetaList lang={lang} />}
        <p aria-hidden="true" className="hero-cue">
          {copy.scrollCue}
        </p>
      </div>
    </section>
  )
}
