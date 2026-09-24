import Link from 'next/link'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import EmptyState from '@/app/components/site/empty-state'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SectionTag from '@/app/components/site/section-tag'
import { projectArchiveCopy } from '@/lib/contents/archive-copy'
import { landingCopy } from '@/lib/contents/site-copy'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { sortShowcase } from '@/lib/site/project-showcase'

/** The three most recent releases; the first one is featured. */
export async function FeaturedReleasesList({ lang }: { lang: Locale }) {
  const projects = sortShowcase(await getProjectShowcase()).slice(0, 3)
  const copy = projectArchiveCopy[lang]

  if (projects.length === 0) {
    return <EmptyState title={copy.emptyTitle} />
  }

  return (
    <ul className="release-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          lang={lang}
          copy={copy}
          titleLevel={3}
          featured={index === 0}
        />
      ))}
    </ul>
  )
}

function ReleasesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="archive-skeleton"
    >
      <span className="skeleton-bar aspect-[16/7] w-full rounded-3xl" />
      <span className="skeleton-bar h-64 w-full rounded-3xl" />
    </div>
  )
}

/** `<releases>`: a static header; the cards stream in from the showcase. */
export default function FeaturedReleases({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].releases

  return (
    <section aria-labelledby="releases-title" className="home-section">
      <div className="home-section-head home-head-row">
        <div className="grid gap-3">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="releases-title" className="home-section-title">
            {copy.title}
          </h2>
        </div>
        <Link
          href={`/${lang}/project`}
          transitionTypes={['nav-forward']}
          className="home-more"
        >
          {copy.link}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <RevealSuspense fallback={<ReleasesSkeleton />}>
        <FeaturedReleasesList lang={lang} />
      </RevealSuspense>
    </section>
  )
}
