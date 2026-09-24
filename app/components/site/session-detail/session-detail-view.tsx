import Link from 'next/link'
import { ViewTransition } from 'react'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import SessionPoster from '@/app/components/site/session-poster'
import type {
  ArchiveCommonCopy,
  SessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import {
  formatLogStamp,
  formatSessionLongDate,
  formatSessionShortDate,
  formatSessionTime,
  toKstIso,
} from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryHue, categoryLabel, partHue } from '@/lib/site/labels'
import { sessionTitle, type LogSession } from '@/lib/site/session-log'

export type SessionDetail = {
  id: string
  title: string
  category: string
  description: string | null
  startAt: Date | null
  endAt: Date | null
  location: string | null
  partName: string | null
  generationName: string
  mainImage: string
  images: string[]
}

export default function SessionDetailView({
  lang,
  session,
  related,
  previous,
  next,
  copy,
  common,
}: {
  lang: Locale
  session: SessionDetail
  related: LogSession[]
  previous: LogSession | null
  next: LogSession | null
  copy: SessionArchiveCopy
  common: ArchiveCommonCopy
}) {
  const hue = categoryHue(session.category)
  const category = categoryLabel(session.category, lang)
  const hubHref = `/${lang}/session`
  const generationHref = `${hubHref}/${session.generationName}`
  const hrefOf = (entry: LogSession) =>
    `${hubHref}/${entry.generationName}/${entry.id}`
  const photos = [session.mainImage, ...session.images].filter(
    (image) => !isPlaceholderImage(image)
  )
  const time = session.startAt
    ? `${formatSessionTime(session.startAt)}${
        session.endAt ? `–${formatSessionTime(session.endAt)}` : ''
      } KST`
    : copy.tba

  return (
    <article className="session-detail" data-hue={hue}>
      <Breadcrumbs
        label={common.breadcrumb}
        items={[
          { label: common.home, href: `/${lang}` },
          { label: common.sessions, href: hubHref },
          { label: session.generationName, href: generationHref },
          { label: session.title },
        ]}
      />
      <header className="session-head">
        <p className="session-commit">
          <span aria-hidden="true" className="commit-dot" />
          {copy.commit} <span>{session.id.slice(0, 7)}</span>
        </p>
        <ViewTransition
          name={`session-title-${session.id}`}
          share="auto"
          default="none"
        >
          <h1 className="session-title">{session.title}</h1>
        </ViewTransition>
        <p className="session-when">
          {session.startAt ? (
            <time dateTime={toKstIso(session.startAt)}>
              {formatSessionLongDate(session.startAt, lang)}
            </time>
          ) : (
            copy.tba
          )}
        </p>
      </header>

      <dl className="session-facts">
        <div>
          <dt>{copy.date}</dt>
          <dd>
            {session.startAt
              ? formatSessionShortDate(session.startAt, lang)
              : copy.tba}
          </dd>
        </div>
        <div>
          <dt>{copy.time}</dt>
          <dd>{time}</dd>
        </div>
        <div>
          <dt>{copy.location}</dt>
          <dd>{session.location ?? copy.locationFallback}</dd>
        </div>
        <div>
          <dt>{copy.generation}</dt>
          <dd>
            <Link href={generationHref} transitionTypes={['nav-back']}>
              {session.generationName}
            </Link>
          </dd>
        </div>
        {session.partName && (
          <div>
            <dt>{copy.part}</dt>
            <dd>
              <Chip hue={partHue(session.partName)}>{session.partName}</Chip>
            </dd>
          </div>
        )}
        <div>
          <dt>{copy.type}</dt>
          <dd>
            <Chip hue={hue}>{category}</Chip>
          </dd>
        </div>
      </dl>

      <div className="session-media">
        {photos.length > 0 ? (
          <ImageSliderGallery images={photos} alt={session.title} />
        ) : (
          <SessionPoster
            hue={hue}
            kicker={category}
            title={session.title}
            date={
              session.startAt
                ? formatSessionShortDate(session.startAt, lang)
                : copy.tba
            }
          />
        )}
      </div>

      <div className="detail-columns">
        <div className="site-prose prose max-w-none">
          <SafeMDX source={session.description} headingOffset={1} />
        </div>
        <aside className="detail-aside">
          {related.length > 0 && (
            <section>
              <h2 className="detail-aside-title">{copy.related}</h2>
              <ul className="detail-links">
                {related.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={hrefOf(entry)}
                      transitionTypes={['nav-forward']}
                    >
                      <span className="detail-link-title">
                        {sessionTitle(entry, lang)}
                      </span>
                      {entry.startAt && (
                        <time
                          dateTime={toKstIso(entry.startAt)}
                          className="detail-link-meta"
                        >
                          {formatLogStamp(entry.startAt, lang)}
                        </time>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(previous || next) && (
            <nav aria-label={copy.chronology} className="detail-pager">
              {previous && (
                <Link
                  href={hrefOf(previous)}
                  rel="prev"
                  transitionTypes={['nav-back']}
                >
                  <span className="detail-pager-label">
                    <ArrowLeftIcon aria-hidden="true" className="size-3" />
                    {copy.previous}
                  </span>
                  <span className="detail-link-title">
                    {sessionTitle(previous, lang)}
                  </span>
                </Link>
              )}
              {next && (
                <Link
                  href={hrefOf(next)}
                  rel="next"
                  transitionTypes={['nav-forward']}
                >
                  <span className="detail-pager-label">
                    {copy.next}
                    <ArrowRightIcon aria-hidden="true" className="size-3" />
                  </span>
                  <span className="detail-link-title">
                    {sessionTitle(next, lang)}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </aside>
      </div>
    </article>
  )
}
