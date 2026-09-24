import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import BracketPoster from '@/app/components/site/bracket-poster'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import ExternalLink from '@/app/components/site/external-link'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import type {
  ArchiveCommonCopy,
  ProjectArchiveCopy,
} from '@/lib/contents/archive-copy'
import { formatInstantDate, toSeoulDateIso } from '@/lib/site/datetime'
import { fillTemplate, initials } from '@/lib/site/format'
import { isPlaceholderImage } from '@/lib/site/images'
import {
  contributorName,
  projectSummary,
  projectTitle,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

export type ProjectDetail = ShowcaseProject & {
  content: string
  images: string[]
}

export default function ProjectDetailView({
  lang,
  project,
  more,
  next,
  copy,
  common,
}: {
  lang: Locale
  project: ProjectDetail
  more: ShowcaseProject[]
  next: ShowcaseProject | null
  copy: ProjectArchiveCopy
  common: ArchiveCommonCopy
}) {
  const title = projectTitle(project, lang)
  const hubHref = `/${lang}/project`
  const generationHref = `${hubHref}/${project.generationName}`
  const gallery = project.images.filter((image) => !isPlaceholderImage(image))
  const links = [
    ...(project.demoUrl
      ? [{ href: project.demoUrl, label: copy.demo, solid: true }]
      : []),
    ...(project.repoUrl
      ? [{ href: project.repoUrl, label: copy.source, solid: false }]
      : []),
  ]

  return (
    <article>
      <Breadcrumbs
        label={common.breadcrumb}
        items={[
          { label: common.home, href: `/${lang}` },
          { label: common.projects, href: hubHref },
          { label: project.generationName, href: generationHref },
          { label: title },
        ]}
      />
      <header className="case-header">
        <p className="case-kicker">
          <Link href={generationHref} transitionTypes={['nav-back']}>
            {project.generationName}
          </Link>
        </p>
        <h1 className="page-header-title">{title}</h1>
        <p className="case-lead">{projectSummary(project, lang)}</p>
        {links.length > 0 && (
          <div className="case-actions">
            {links.map((link) => (
              <ExternalLink
                key={link.href}
                href={link.href}
                className="case-action"
                data-tone={link.solid ? 'solid' : undefined}
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        )}
      </header>

      <figure className="case-cover">
        <ViewTransition name={`project-cover-${project.id}`}>
          {isPlaceholderImage(project.mainImage) ? (
            <span aria-hidden="true" className="release-cover-art">
              <BracketPoster side="left" />
              <BracketPoster side="right" />
            </span>
          ) : (
            <Image
              src={project.mainImage}
              alt={title}
              fill
              preload
              sizes="(min-width: 1152px) 1104px, calc(100vw - 2rem)"
            />
          )}
        </ViewTransition>
      </figure>

      <div className="detail-columns">
        <div className="site-prose prose max-w-none">
          <SafeMDX source={project.content} />
        </div>
        <aside aria-label={copy.details} className="detail-aside">
          {project.contributors.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.team}</h2>
              <ul className="team-list">
                {project.contributors.map((contributor) => {
                  const name = contributorName(contributor, lang)
                  return (
                    <li key={contributor.id} className="team-member">
                      <span aria-hidden="true" className="team-avatar">
                        {contributor.image ? (
                          <Image
                            src={contributor.image}
                            alt=""
                            width={32}
                            height={32}
                          />
                        ) : (
                          initials(name)
                        )}
                      </span>
                      <span>{name}</span>
                      {contributor.githubId && (
                        <a
                          href={`https://github.com/${contributor.githubId.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${name} GitHub`}
                          className="team-github"
                        >
                          GitHub
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Link
                href={`/${lang}/member/${project.generationName}`}
                className="detail-more"
              >
                {fillTemplate(copy.allMembers, {
                  generation: project.generationName,
                })}
              </Link>
            </section>
          )}
          {project.tags.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.stack}</h2>
              <ul className="release-tags">
                {project.tags.map((tag) => (
                  <li key={tag}>
                    <Chip>{tag}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {links.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.links}</h2>
              <div className="detail-external">
                {links.map((link) => (
                  <ExternalLink key={link.href} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="detail-aside-title">{copy.dates}</h2>
            <dl className="detail-dates">
              <dt>{copy.published}</dt>
              <dd>
                <time dateTime={toSeoulDateIso(project.createdAt)}>
                  {formatInstantDate(project.createdAt, lang)}
                </time>
              </dd>
              <dt>{copy.updated}</dt>
              <dd>
                <time dateTime={toSeoulDateIso(project.updatedAt)}>
                  {formatInstantDate(project.updatedAt, lang)}
                </time>
              </dd>
            </dl>
          </section>
        </aside>
      </div>

      {gallery.length > 0 && (
        <section aria-labelledby="case-gallery" className="case-section">
          <h2 id="case-gallery" className="case-section-title">
            {copy.gallery}
          </h2>
          <ImageSliderGallery images={gallery} alt={title} />
        </section>
      )}

      {more.length > 0 && (
        <section aria-labelledby="case-more" className="case-section">
          <h2 id="case-more" className="case-section-title">
            {fillTemplate(copy.moreFrom, {
              generation: project.generationName,
            })}
          </h2>
          <ul className="release-grid">
            {more.map((entry) => (
              <ProjectCard
                key={entry.id}
                project={entry}
                lang={lang}
                copy={copy}
                titleLevel={3}
              />
            ))}
          </ul>
        </section>
      )}

      {next && (
        <nav aria-label={copy.nextProject} className="case-next detail-pager">
          <Link
            href={`${hubHref}/${next.generationName}/${next.id}`}
            transitionTypes={['nav-forward']}
          >
            <span className="detail-pager-label">
              {copy.nextProject}
              <ArrowRightIcon aria-hidden="true" className="size-3" />
            </span>
            <span className="detail-link-title">
              {projectTitle(next, lang)}
            </span>
          </Link>
        </nav>
      )}
    </article>
  )
}
