import { Suspense } from 'react'
import { connection } from 'next/server'
import type { Locale } from '@/i18n-config'
import languageParamChecker from '@/lib/language-param-checker'
import { buildHeatmapWeeks, type ActivityCategory } from '@/lib/heatmap'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import {
  getFeaturedProjects,
  getHeatmapSessions,
} from '@/lib/server/queries/public/home'
import AboutTeaser from '@/app/components/home/about-teaser'
import ActivityHeatmap from '@/app/components/home/activity-heatmap'
import Hero from '@/app/components/home/hero'
import PartsBentoGrid from '@/app/components/home/parts-bento-grid'
import ProjectsShowcase from '@/app/components/home/projects-showcase'

// SSG 파라미터 (기존과 동일)
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

const SECTION_TITLES = {
  activity: { en: 'Activity', ko: '활동' },
  parts: { en: 'Parts', ko: '파트' },
  projects: { en: 'Projects', ko: '프로젝트' },
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

function HeatmapSkeleton() {
  return (
    <div
      className={
        'grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1.5'
      }
    >
      {Array.from({ length: 52 }, (_, index) => (
        <div
          key={index}
          className={
            'bg-surface-raised border-ink/5 aspect-square w-full animate-pulse rounded-sm border'
          }
        />
      ))}
    </div>
  )
}

async function HeatmapSection({ lang }: { lang: Locale }) {
  // 현재 시각(visibility bucket) 사용 — 기존 세션 페이지와 동일하게 connection()으로 동적 처리
  await connection()
  const visibilityBucket = getSessionVisibilityBucket()
  const rows = await getHeatmapSessions(lang, visibilityBucket)

  const weeks = buildHeatmapWeeks(
    rows
      .filter((row) => row.startAt !== null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        nameKo: row.nameKo,
        startAt: row.startAt!.toISOString(),
        category: row.category as ActivityCategory,
        participantCount: row.internalCount + row.externalCount,
      })),
    new Date(visibilityBucket)
  )

  return <ActivityHeatmap weeks={weeks} lang={lang} />
}

async function ProjectsSection({ lang }: { lang: Locale }) {
  const projects = await getFeaturedProjects(lang)
  return <ProjectsShowcase projects={projects} lang={lang} />
}

/**
 * GDGoC Yonsei 웹사이트 첫 페이지 — 리디자인 (스펙 §7)
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const lang = languageParamChecker((await params).lang)

  return (
    <main className={'flex w-full flex-col overflow-x-hidden pt-[4.5rem]'}>
      <Hero lang={lang} />
      <AboutTeaser lang={lang} />
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-4xl'}>
          <SectionHeading label={'activity'} lang={lang} />
          <Suspense fallback={<HeatmapSkeleton />}>
            <HeatmapSection lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'parts'} lang={lang} />
          <PartsBentoGrid lang={lang} />
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'projects'} lang={lang} />
          <Suspense fallback={null}>
            <ProjectsSection lang={lang} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
