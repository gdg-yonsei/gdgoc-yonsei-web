/**
 * 세션 허브·기수 페이지의 세션 로그(서버 컴포넌트). 그룹 구조는 `lib/site/session-log.ts`가 만든다.
 */
import type { Locale } from '@/lib/i18n'
import type { SessionArchiveCopy } from '@/lib/contents/archive-copy'
import { formatMonthKey } from '@/lib/format/datetime'
import { countLabel } from '@/lib/format/text'
import {
  TBA_MONTH,
  type LogGeneration,
  type LogMonth,
} from '@/lib/site/session-log'
import SessionRow from './session-row'

/** 월별 묶음과 그 안의 세션 행. `level`은 월 제목의 태그 수준이다. */
function Months({
  months,
  lang,
  copy,
  level,
}: {
  months: LogMonth[]
  lang: Locale
  copy: SessionArchiveCopy
  level: 2 | 3
}) {
  const Heading = level === 2 ? 'h2' : 'h3'

  return months.map((month) => (
    <div key={month.key} data-filter-group="" className="log-month">
      <Heading className="log-month-title">
        {month.key === TBA_MONTH ? copy.tba : formatMonthKey(month.key, lang)}
      </Heading>
      <ol className="log-rows">
        {month.sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            lang={lang}
            titleLevel={level === 2 ? 3 : 4}
            tbaLabel={copy.tba}
          />
        ))}
      </ol>
    </div>
  ))
}

/**
 * 세션 로그. 허브는 기수마다 섹션을 두고(h2 기수 › h3 월 › h4 세션), 기수 페이지는
 * 기수 단계를 빼고 그린다(h2 월 › h3 세션). 제목 수준을 맞춰야 문서 구조가 올바르다.
 * @param id 목록 요소 id(`FilterBar`의 `scope`)
 * @param showGenerations 기수별 섹션으로 묶을지(허브는 true)
 */
export default function SessionLog({
  id,
  lang,
  generations,
  copy,
  showGenerations,
}: {
  id: string
  lang: Locale
  generations: LogGeneration[]
  copy: SessionArchiveCopy
  showGenerations: boolean
}) {
  return (
    <div id={id} className="session-log">
      {generations.map((generation) =>
        showGenerations ? (
          <section
            key={generation.name}
            data-filter-group=""
            aria-labelledby={`log-${generation.name}`}
          >
            <h2 id={`log-${generation.name}`} className="log-generation-title">
              {generation.name}{' '}
              <span className="log-generation-count">
                {countLabel(generation.count, copy.countOne, copy.countMany)}
              </span>
            </h2>
            <Months
              months={generation.months}
              lang={lang}
              copy={copy}
              level={3}
            />
          </section>
        ) : (
          <div key={generation.name}>
            <Months
              months={generation.months}
              lang={lang}
              copy={copy}
              level={2}
            />
          </div>
        )
      )}
    </div>
  )
}
