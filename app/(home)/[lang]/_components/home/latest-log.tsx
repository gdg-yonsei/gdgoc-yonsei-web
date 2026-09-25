import Link from 'next/link'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import EmptyState from '@/app/components/site/empty-state'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SectionTag from '@/app/components/site/section-tag'
import SessionRow from '@/app/components/site/session-log/session-row'
import { sessionArchiveCopy } from '@/lib/contents/archive-copy'
import { landingCopy } from '@/lib/contents/site-copy'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { latestSessions } from '@/lib/site/session-log'

const LATEST_COUNT = 6

/** The six newest public sessions, drawn with the Session Log's row. */
export async function LatestLogList({ lang }: { lang: Locale }) {
  const archive = await getSessionArchive(
    await getCachedSessionVisibilityBucket()
  )
  const sessions = latestSessions(archive, LATEST_COUNT)
  const copy = sessionArchiveCopy[lang]

  // Title only: the archive's empty body talks about "this generation".
  if (sessions.length === 0) {
    return <EmptyState title={copy.emptyTitle} />
  }

  return (
    <ol className="log-rows">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          lang={lang}
          titleLevel={3}
          tbaLabel={copy.tba}
        />
      ))}
    </ol>
  )
}

function LatestLogSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading sessions"
      className="archive-skeleton"
    >
      {Array.from({ length: LATEST_COUNT }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

/** `<log>`: a static header; the rows stream in from the session archive. */
export default function LatestLog({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].log

  return (
    <section
      aria-labelledby="latest-log-title"
      data-scene="log"
      className="home-section"
    >
      <div className="home-section-head home-head-row">
        <div className="grid gap-3">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="latest-log-title" className="home-section-title">
            {copy.title}
          </h2>
        </div>
        <Link
          href={`/${lang}/session`}
          transitionTypes={['nav-forward']}
          className="home-more"
        >
          {copy.link}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <RevealSuspense fallback={<LatestLogSkeleton />}>
        <LatestLogList lang={lang} />
      </RevealSuspense>
    </section>
  )
}
