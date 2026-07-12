'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LazyMotion, domMax, m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import type { FeaturedProject } from '@/lib/server/queries/public/home'

const SHOWCASE_COPY = {
  all: { en: 'All', ko: '전체' },
  empty: {
    en: 'Projects will appear here once they are published in GYMS.',
    ko: '어드민(GYMS)에서 프로젝트를 등록하면 이곳에 표시됩니다.',
  },
  repo: { en: 'Code', ko: '코드' },
  demo: { en: 'Demo', ko: '데모' },
} as const

function tagPillClass(active: boolean): string {
  return `rounded-full px-3 py-1 font-mono text-xs transition-colors ${
    active
      ? 'bg-ink text-white'
      : 'bg-surface-raised text-ink/70 border-ink/10 border'
  }`
}

export default function ProjectsShowcase({
  projects,
  lang,
}: {
  projects: FeaturedProject[]
  lang: Locale
}) {
  const shouldReduce = useReducedMotion()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  if (projects.length === 0) {
    return (
      <div
        className={
          'border-ink/10 bg-surface-raised rounded-2xl border border-dashed p-10 text-center'
        }
      >
        <p className={'text-ink/60'}>{SHOWCASE_COPY.empty[lang]}</p>
      </div>
    )
  }

  const allTags = [...new Set(projects.flatMap((project) => project.tags))]
  const visibleProjects = activeTag
    ? projects.filter((project) => project.tags.includes(activeTag))
    : projects

  return (
    <LazyMotion features={domMax}>
      <div className={'flex flex-col gap-6'}>
        <div className={'flex flex-wrap gap-2'}>
          <button
            type={'button'}
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={tagPillClass(activeTag === null)}
          >
            {SHOWCASE_COPY.all[lang]}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type={'button'}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={tagPillClass(activeTag === tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div
          className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}
        >
          {visibleProjects.map((project) => (
            <m.article
              key={project.id}
              layout={!shouldReduce}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={
                'bg-surface-raised relative overflow-hidden rounded-2xl'
              }
              style={{ contain: 'layout style paint' }}
            >
              <Link
                href={`/${lang}/project/${project.generationName}/${project.id}`}
                className={'block'}
              >
                <div className={'relative aspect-video w-full'}>
                  <Image
                    src={project.mainImage}
                    alt={
                      lang === 'ko'
                        ? (project.nameKo ?? project.name)
                        : project.name
                    }
                    fill
                    sizes={
                      '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    }
                    className={'object-cover'}
                  />
                </div>
                <div className={'flex flex-col gap-2 p-5'}>
                  <span className={'text-ink/40 font-mono text-xs'}>
                    {project.generationName}
                  </span>
                  <h3 className={'text-ink text-lg font-semibold'}>
                    {lang === 'ko'
                      ? (project.nameKo ?? project.name)
                      : project.name}
                  </h3>
                  <p className={'text-ink/60 line-clamp-2 text-sm'}>
                    {lang === 'ko'
                      ? (project.descriptionKo ?? project.description)
                      : project.description}
                  </p>
                  <div className={'flex flex-wrap gap-1.5'}>
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className={
                          'bg-surface text-ink/60 rounded-full px-2 py-0.5 font-mono text-[11px]'
                        }
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
              {(project.repoUrl || project.demoUrl) && (
                <div className={'flex gap-3 px-5 pb-4'}>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target={'_blank'}
                      rel={'noreferrer noopener'}
                      className={'text-yonsei-blue font-mono text-xs underline'}
                    >
                      {SHOWCASE_COPY.repo[lang]} ↗
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target={'_blank'}
                      rel={'noreferrer noopener'}
                      className={'text-yonsei-blue font-mono text-xs underline'}
                    >
                      {SHOWCASE_COPY.demo[lang]} ↗
                    </a>
                  )}
                </div>
              )}
            </m.article>
          ))}
        </div>
      </div>
    </LazyMotion>
  )
}
