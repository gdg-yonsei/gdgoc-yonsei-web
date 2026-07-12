import type { Metadata } from 'next'
import { Suspense } from 'react'
import { connection } from 'next/server'
import type { Locale } from '@/i18n-config'
import languageParamChecker from '@/lib/language-param-checker'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import {
  getCommunityStats,
  getGenerationTimeline,
} from '@/lib/server/queries/public/home'
import AboutHero from '@/app/components/about/about-hero'
import PartsDeepdiveSection from '@/app/components/about/parts-deepdive-section'
import ProgramsSection from '@/app/components/about/programs-section'
import StatsSection from '@/app/components/about/stats-section'
import StorySection from '@/app/components/about/story-section'
import TimelineSection from '@/app/components/about/timeline-section'

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const lang = languageParamChecker((await params).lang)

  if (lang === 'ko') {
    return {
      title: '소개',
      description: 'GDGoC Yonsei를 소개합니다 — Connect, Learn, Grow.',
    }
  }
  return {
    title: 'About',
    description: 'About GDGoC Yonsei — Connect, Learn, Grow.',
  }
}

const SECTION_TITLES = {
  programs: { en: 'Programs', ko: '프로그램' },
  history: { en: 'History', ko: '연혁' },
  parts: { en: 'Parts & Join', ko: '파트 & 함께하기' },
} as const

function SectionHeading({
  label,
  lang,
}: {
  label: keyof typeof SECTION_TITLES
  lang: Locale
}) {
  return (
    <div className={'mb-8 flex items-baseline gap-3'}>
      <span
        className={
          'text-yonsei-blue font-mono text-xs tracking-widest uppercase'
        }
      >
        {label}
      </span>
      <h2 className={'text-ink text-3xl font-bold md:text-4xl'}>
        {SECTION_TITLES[label][lang]}
      </h2>
    </div>
  )
}

async function TimelineData({ lang }: { lang: Locale }) {
  await connection()
  const visibilityBucket = getSessionVisibilityBucket()
  const entries = await getGenerationTimeline(lang, visibilityBucket)
  return <TimelineSection entries={entries} lang={lang} />
}

async function StatsData({ lang }: { lang: Locale }) {
  const stats = await getCommunityStats(lang)
  return <StatsSection stats={stats} lang={lang} />
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const lang = languageParamChecker((await params).lang)

  return (
    <main className={'flex w-full flex-col overflow-x-hidden'}>
      <AboutHero lang={lang} />
      <StorySection lang={lang} />
      <section className={'cv-auto w-full px-6 py-20'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'programs'} lang={lang} />
          <ProgramsSection lang={lang} />
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-20'}>
        <div className={'mx-auto max-w-4xl'}>
          <SectionHeading label={'history'} lang={lang} />
          <Suspense fallback={null}>
            <TimelineData lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'w-full px-6 py-20'}>
        <div className={'mx-auto max-w-5xl'}>
          <Suspense fallback={null}>
            <StatsData lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-20 pb-28'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'parts'} lang={lang} />
          <PartsDeepdiveSection lang={lang} />
        </div>
      </section>
    </main>
  )
}
