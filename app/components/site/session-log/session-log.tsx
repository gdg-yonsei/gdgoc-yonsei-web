import type { Locale } from '@/i18n-config'
import type { SessionArchiveCopy } from '@/lib/contents/archive-copy'
import { formatMonthKey } from '@/lib/site/datetime'
import { countLabel } from '@/lib/site/format'
import {
  TBA_MONTH,
  type LogGeneration,
  type LogMonth,
} from '@/lib/site/session-log'
import SessionRow from './session-row'

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
 * The Session Log. Hubs show one section per generation (h2 › h3 month ›
 * h4 session); generation pages drop that level (h2 month › h3 session).
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
