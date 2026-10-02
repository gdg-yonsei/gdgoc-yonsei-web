/**
 * 세션 로그의 한 줄(서버 컴포넌트).
 */
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import Chip from '@/app/components/site/chip'
import StaticImage from '@/app/components/site/static-image'
import { formatLogStamp, toKstIso } from '@/lib/format/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryHue, categoryLabel, partHue } from '@/lib/site/labels'
import {
  sessionLocation,
  sessionSearchText,
  sessionTitle,
  type LogSession,
} from '@/lib/site/session-log'
import { sessionPath, localeHref } from '@/lib/site/routes'

/**
 * 커밋 로그 모양의 세션 한 줄. 제목 링크가 행 전체를 덮는다. `data-*` 속성은
 * `FilterBar`가 검색·필터에 쓴다.
 * @param titleLevel 제목 태그 수준
 * @param tbaLabel 일시 미정일 때 문구
 */
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
              href={localeHref(
                lang,
                sessionPath(session.generationName, session.id)
              )}
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
          <StaticImage
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
