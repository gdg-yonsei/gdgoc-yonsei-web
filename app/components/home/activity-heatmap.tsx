'use client'

import { type CSSProperties, useState } from 'react'
import { m } from 'motion/react'
import type { Locale } from '@/i18n-config'
import {
  CATEGORY_CELL_CLASS,
  CATEGORY_LABEL,
  CATEGORY_PRIORITY,
  intensityOpacity,
  type HeatmapWeek,
} from '@/lib/heatmap'

const HEATMAP_COPY = {
  caption: { en: 'Last 52 weeks', ko: '최근 52주' },
  empty: {
    en: 'No activities recorded yet.',
    ko: '아직 기록된 활동이 없어요.',
  },
} as const

function formatWeekLabel(weekKey: string, lang: Locale): string {
  return lang === 'ko' ? `${weekKey} 주` : `Week of ${weekKey}`
}

function cellAriaLabel(week: HeatmapWeek, lang: Locale): string {
  if (week.count === 0) {
    return lang === 'ko'
      ? `${formatWeekLabel(week.weekKey, 'ko')}: 활동 없음`
      : `${formatWeekLabel(week.weekKey, 'en')}: no activity`
  }
  return lang === 'ko'
    ? `${formatWeekLabel(week.weekKey, 'ko')}: 활동 ${week.count}건`
    : `${formatWeekLabel(week.weekKey, 'en')}: ${week.count} activities`
}

export default function ActivityHeatmap({
  weeks,
  lang,
}: {
  weeks: HeatmapWeek[]
  lang: Locale
}) {
  const [revealed, setRevealed] = useState(false)
  const [activeWeekKey, setActiveWeekKey] = useState<string | null>(null)

  const total = weeks.reduce((sum, week) => sum + week.count, 0)
  const activeWeek =
    weeks.find((week) => week.weekKey === activeWeekKey && week.count > 0) ??
    null

  return (
    <m.div
      onViewportEnter={() => setRevealed(true)}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'flex w-full flex-col gap-4'}
    >
      <div
        className={`grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1.5 ${
          revealed ? 'heatmap-grid-revealed' : ''
        }`}
      >
        {weeks.map((week, index) => (
          <button
            key={week.weekKey}
            type={'button'}
            aria-label={cellAriaLabel(week, lang)}
            onMouseEnter={() => setActiveWeekKey(week.weekKey)}
            onMouseLeave={() => setActiveWeekKey(null)}
            onFocus={() => setActiveWeekKey(week.weekKey)}
            onBlur={() => setActiveWeekKey(null)}
            className={'heatmap-cell relative aspect-square w-full rounded-sm'}
            style={{ '--i': index } as CSSProperties}
          >
            <span
              aria-hidden
              className={`absolute inset-0 rounded-sm ${
                week.dominantCategory
                  ? CATEGORY_CELL_CLASS[week.dominantCategory]
                  : 'border-ink/10 bg-surface-raised border'
              }`}
              style={{
                opacity: week.dominantCategory
                  ? intensityOpacity(week.count)
                  : 1,
              }}
            />
          </button>
        ))}
      </div>

      <div className={'flex flex-wrap items-center gap-x-4 gap-y-1'}>
        {CATEGORY_PRIORITY.map((category) => (
          <span key={category} className={'flex items-center gap-1.5'}>
            <span
              aria-hidden
              className={`size-2 rounded-full ${CATEGORY_CELL_CLASS[category]}`}
            />
            <span className={'text-ink/60 font-mono text-xs'}>
              {CATEGORY_LABEL[category][lang]}
            </span>
          </span>
        ))}
        <span className={'text-ink/40 ml-auto font-mono text-xs'}>
          {HEATMAP_COPY.caption[lang]}
        </span>
      </div>

      <div aria-live={'polite'} className={'min-h-24'}>
        {total === 0 && (
          <p className={'text-ink/60'}>{HEATMAP_COPY.empty[lang]}</p>
        )}
        {activeWeek && (
          <div
            className={'bg-surface-raised rounded-xl p-4 shadow-sm'}
            style={{ contain: 'layout style paint' }}
          >
            <p className={'text-ink/50 font-mono text-xs'}>
              {formatWeekLabel(activeWeek.weekKey, lang)}
            </p>
            <ul className={'mt-1 flex flex-col gap-1'}>
              {activeWeek.sessions.map((session) => (
                <li key={session.id} className={'flex items-baseline gap-2'}>
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 self-center rounded-full ${
                      CATEGORY_CELL_CLASS[session.category]
                    }`}
                  />
                  <span className={'text-ink font-medium'}>
                    {lang === 'ko' ? session.nameKo : session.name}
                  </span>
                  <span className={'text-ink/50 font-mono text-xs'}>
                    {session.startAt.slice(0, 10)} ·{' '}
                    {lang === 'ko'
                      ? `${session.participantCount}명 참여`
                      : `${session.participantCount} participants`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </m.div>
  )
}
