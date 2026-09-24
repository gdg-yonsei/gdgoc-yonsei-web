import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import Chip from '@/app/components/site/chip'
import { formatLogStamp, toKstIso } from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryHue, categoryLabel, partHue } from '@/lib/site/labels'
import {
  sessionLocation,
  sessionSearchText,
  sessionTitle,
  type LogSession,
} from '@/lib/site/session-log'

/** One commit on the log. The title link stretches over the whole row. */
export default function SessionRow({
  session,
  lang,
  titleLevel,
  tbaLabel,
}: {
  session: LogSession
  lang: Locale
  titleLevel: 3 | 4
  tbaLabel: string
}) {
  const Title = titleLevel === 3 ? 'h3' : 'h4'
  const hue = categoryHue(session.category)
  const location = sessionLocation(session, lang)

  return (
    <li
      data-filter-item=""
      data-search={sessionSearchText(session)}
      data-f-category={session.category}
      data-f-part={session.partName ?? ''}
      data-f-generation={session.generationName}
    >
      <article className="log-entry">
        <span aria-hidden="true" className="log-node" data-hue={hue} />
        <div className="log-main">
          <p className="log-stamp">
            {session.startAt ? (
              <time dateTime={toKstIso(session.startAt)}>
                {formatLogStamp(session.startAt, lang)}
              </time>
            ) : (
              tbaLabel
            )}
          </p>
          <Title className="log-title">
            <Link
              href={`/${lang}/session/${session.generationName}/${session.id}`}
              transitionTypes={['nav-forward']}
            >
              {sessionTitle(session, lang)}
            </Link>
          </Title>
          <div className="log-meta">
            <Chip hue={hue}>{categoryLabel(session.category, lang)}</Chip>
            {session.partName && (
              <Chip hue={partHue(session.partName)}>{session.partName}</Chip>
            )}
            {location && <span>{location}</span>}
          </div>
        </div>
        {!isPlaceholderImage(session.mainImage) && (
          <Image
            src={session.mainImage}
            alt=""
            width={112}
            height={84}
            sizes="88px"
            className="log-thumb"
          />
        )}
      </article>
    </li>
  )
}
