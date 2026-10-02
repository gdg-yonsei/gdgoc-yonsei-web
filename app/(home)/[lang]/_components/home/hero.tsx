/**
 * 홈 히어로(첫 화면) 섹션(서버 컴포넌트). 텍스트와 SVG 괄호는 서버에서 그려 JS 없이도 완성된 화면이다.
 */
import type { CSSProperties, ReactNode } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/lib/i18n'
import { googleSans } from '@/app/fonts'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink from '@/app/components/site/button-link'
import { cn } from '@/lib/cn'
import { heroCopy } from '@/lib/contents/site-copy'
import { countLabel } from '@/lib/format/text'
import BracketStage from './bracket-stage'
import { localeHref } from '@/lib/site/routes'

const rise = (delayMs: number) =>
  ({ '--rise-delay': `${delayMs}ms` }) as CSSProperties

/** 히어로 메타 띠에 보일 개수. */
export type HeroCounts = {
  sessions: number
  projects: number
  generations: number
}

/** 고정폭 글꼴 메타 정보 띠. 개수가 없으면 같은 폭의 자리 표시자를 둔다(레이아웃이 튀지 않게). */
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
 * "< GDGoC Yonsei >": 동아리 이름이 GDG 괄호 두 개 사이에 놓인다. SVG 포스터는 바로 그려지고,
 * 브라우저가 한가해지면 BracketStage가 실시간 망점 필드로 바꾼다.
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
          <h1 id="hero-title" className={cn('hero-title', googleSans.variable)}>
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
          <ButtonLink href={localeHref(lang, '/session')} tone="stageSolid">
            {copy.primaryCta}
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/project')} tone="stageOutline">
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
