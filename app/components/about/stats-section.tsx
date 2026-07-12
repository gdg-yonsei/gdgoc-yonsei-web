'use client'

import { useEffect, useState } from 'react'
import { animate, m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import type { CommunityStats } from '@/lib/server/queries/public/home'

const STAT_ITEMS: Array<{
  key: keyof CommunityStats
  label: { en: string; ko: string }
}> = [
  { key: 'sessionCount', label: { en: 'Activities', ko: '누적 활동' } },
  { key: 'participantTotal', label: { en: 'Participations', ko: '누적 참여' } },
  { key: 'partCount', label: { en: 'Parts', ko: '파트' } },
  { key: 'projectCount', label: { en: 'Projects', ko: '프로젝트' } },
]

function CountUp({ target, start }: { target: number; start: boolean }) {
  const shouldReduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) {
      return
    }
    if (shouldReduce || target === 0) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    })
    return () => controls.stop()
  }, [start, target, shouldReduce])

  return (
    <span className={'font-mono text-4xl font-bold md:text-5xl'}>{value}</span>
  )
}

export default function StatsSection({
  stats,
  lang,
}: {
  stats: CommunityStats
  lang: Locale
}) {
  const shouldReduce = useReducedMotion()
  const [started, setStarted] = useState(false)
  const active = Boolean(shouldReduce) || started

  return (
    <m.dl
      onViewportEnter={() => setStarted(true)}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'grid grid-cols-2 gap-4 md:grid-cols-4'}
    >
      {STAT_ITEMS.map((item) => (
        <div
          key={item.key}
          className={'bg-surface-raised flex flex-col gap-1 rounded-2xl p-6'}
          style={{ contain: 'layout style paint' }}
        >
          <dt
            className={
              'text-ink/50 font-mono text-xs tracking-widest uppercase'
            }
          >
            {item.label[lang]}
          </dt>
          <dd className={'text-yonsei-blue'}>
            <CountUp target={stats[item.key]} start={active} />
          </dd>
        </div>
      ))}
    </m.dl>
  )
}
