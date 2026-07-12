'use client'

import { useRef } from 'react'
import { m, useReducedMotion, useScroll } from 'motion/react'
import type { Locale } from '@/i18n-config'
import { CATEGORY_CELL_CLASS, CATEGORY_PRIORITY } from '@/lib/heatmap'
import type { GenerationTimelineEntry } from '@/lib/server/queries/public/home'

const TIMELINE_COPY = {
  empty: {
    en: 'History will appear as generations are added.',
    ko: '기수가 등록되면 연혁이 표시됩니다.',
  },
  present: { en: 'present', ko: '현재' },
} as const

function highlightSessions(entry: GenerationTimelineEntry) {
  return [...entry.sessions]
    .sort(
      (a, b) =>
        CATEGORY_PRIORITY.indexOf(a.category) -
        CATEGORY_PRIORITY.indexOf(b.category)
    )
    .slice(0, 4)
}

export default function TimelineSection({
  entries,
  lang,
}: {
  entries: GenerationTimelineEntry[]
  lang: Locale
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 60%'],
  })

  if (entries.length === 0) {
    return <p className={'text-ink/60'}>{TIMELINE_COPY.empty[lang]}</p>
  }

  return (
    <div ref={containerRef} className={'relative pl-6'}>
      <span
        aria-hidden
        className={'bg-ink/10 absolute top-0 left-1 h-full w-0.5 rounded'}
      />
      {/* 진행선: scaleY만 변형 (컴포지터 전용) */}
      <m.span
        aria-hidden
        className={
          'bg-yonsei-blue absolute top-0 left-1 h-full w-0.5 origin-top rounded'
        }
        style={{ scaleY: shouldReduce ? 1 : scrollYProgress }}
      />
      <ol className={'flex flex-col gap-10'}>
        {entries.map((entry) => (
          <li key={entry.id} className={'relative'}>
            <span
              aria-hidden
              className={
                'bg-yonsei-blue absolute top-1.5 -left-6 size-2.5 -translate-x-[3px] rounded-full'
              }
            />
            <p className={'text-ink/40 font-mono text-xs'}>
              {entry.startDate.slice(0, 7)} —{' '}
              {entry.endDate
                ? entry.endDate.slice(0, 7)
                : TIMELINE_COPY.present[lang]}
            </p>
            <h3 className={'text-ink mt-1 text-2xl font-bold'}>{entry.name}</h3>
            <ul className={'mt-3 flex flex-col gap-1.5'}>
              {highlightSessions(entry).map((session) => (
                <li key={session.id} className={'flex items-center gap-2'}>
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${
                      CATEGORY_CELL_CLASS[session.category]
                    }`}
                  />
                  <span className={'text-ink/80 text-sm'}>
                    {lang === 'ko' ? session.nameKo : session.name}
                  </span>
                </li>
              ))}
              {entry.sessions.length === 0 && (
                <li className={'text-ink/40 text-sm'}>—</li>
              )}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
