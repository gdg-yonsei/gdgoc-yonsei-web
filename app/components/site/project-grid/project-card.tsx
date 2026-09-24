import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import Chip from '@/app/components/site/chip'
import ExternalLink from '@/app/components/site/external-link'
import type { ProjectArchiveCopy } from '@/lib/contents/archive-copy'
import { joinFacetValues } from '@/lib/site/filter-state'
import { initials } from '@/lib/site/format'
import { isPlaceholderImage } from '@/lib/site/images'
import {
  contributorName,
  projectLinkValues,
  projectSearchText,
  projectSummary,
  projectTitle,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

const COVER_SIZES = '(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw'
const FEATURED_SIZES =
  '(min-width: 1024px) 740px, (min-width: 640px) 50vw, 100vw'

/**
 * A release card. The title link stretches over the card; the demo and
 * source links sit above it, so anchors are never nested.
 */
export default function ProjectCard({
  project,
  lang,
  copy,
  titleLevel,
  featured = false,
}: {
  project: ShowcaseProject
  lang: Locale
  copy: ProjectArchiveCopy
  titleLevel: 2 | 3
  featured?: boolean
}) {
  const Title = titleLevel === 2 ? 'h2' : 'h3'
  const title = projectTitle(project, lang)
  const team = project.contributors.slice(0, 4)
  const hiddenCount = project.contributors.length - team.length

  return (
    <li
      className="release-item"
      data-featured={featured ? '' : undefined}
      data-filter-item=""
      data-search={projectSearchText(project)}
      data-f-generation={project.generationName}
      data-f-tag={joinFacetValues(project.tags)}
      data-f-links={joinFacetValues(projectLinkValues(project))}
    >
      <article className="release-card">
        <div className="release-cover">
          <ViewTransition name={`project-cover-${project.id}`}>
            {isPlaceholderImage(project.mainImage) ? (
              <span aria-hidden="true" className="release-cover-art">
                <BracketPoster side="left" />
                <BracketPoster side="right" />
              </span>
            ) : (
              <Image
                src={project.mainImage}
                alt=""
                fill
                sizes={featured ? FEATURED_SIZES : COVER_SIZES}
              />
            )}
          </ViewTransition>
        </div>
        <div className="release-body">
          <p className="release-generation">{project.generationName}</p>
          <Title className="release-title">
            <Link
              href={`/${lang}/project/${project.generationName}/${project.id}`}
              className="stretched-link"
              transitionTypes={['nav-forward']}
            >
              {title}
            </Link>
          </Title>
          <p className="release-summary">{projectSummary(project, lang)}</p>
          {project.tags.length > 0 && (
            <ul aria-label={copy.stack} className="release-tags">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Chip>{tag}</Chip>
                </li>
              ))}
            </ul>
          )}
          <div className="release-foot">
            {team.length > 0 && (
              <ul aria-label={copy.team} className="release-team">
                {team.map((contributor) => {
                  const name = contributorName(contributor, lang)
                  return (
                    <li key={contributor.id}>
                      <span aria-hidden="true">{initials(name)}</span>
                      <span className="sr-only">{name}</span>
                    </li>
                  )
                })}
                {hiddenCount > 0 && <li>+{hiddenCount}</li>}
              </ul>
            )}
            {(project.demoUrl || project.repoUrl) && (
              <div className="release-links">
                {project.demoUrl && (
                  <ExternalLink
                    href={project.demoUrl}
                    aria-label={`${copy.demo}: ${title}`}
                    className="release-link"
                  >
                    {copy.demo}
                  </ExternalLink>
                )}
                {project.repoUrl && (
                  <ExternalLink
                    href={project.repoUrl}
                    aria-label={`${copy.source}: ${title}`}
                    className="release-link"
                  >
                    {copy.source}
                  </ExternalLink>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}
