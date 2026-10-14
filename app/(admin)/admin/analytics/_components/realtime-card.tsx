'use client'

/** 최근 5분 활성 방문자와 30분 분당 조회. 30초마다 실시간 API를 다시 부르고, 실패하면 마지막 값을 유지한다. */
import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import { formatNumber } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { RealtimeSnapshot } from '@/lib/server/analytics/queries/realtime'

const REFRESH_MS = 30_000

export default function RealtimeCard({
  initial,
  includeInternal,
}: {
  initial: RealtimeSnapshot
  includeInternal: boolean
}) {
  const { t, locale } = useAdminI18n()
  const [snapshot, setSnapshot] = useState(initial)

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetch(
        `/api/admin/analytics/realtime${includeInternal ? '?internal=1' : ''}`,
        { cache: 'no-store' }
      )
        .then((response) =>
          response.ok ? (response.json() as Promise<RealtimeSnapshot>) : null
        )
        .then((next) => {
          if (next) setSnapshot(next)
        })
        .catch(() => {})
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [includeInternal])

  return (
    <section
      className={'admin-card flex flex-col gap-3'}
      aria-labelledby={'analytics-realtime-title'}
    >
      <div className={'flex items-baseline justify-between gap-2'}>
        <h2 id={'analytics-realtime-title'} className={'type-title text-ink'}>
          {t('analyticsRealtime')}
        </h2>
        <span className={'type-caption text-ink-muted'}>
          {t('analyticsActiveVisitors')}
        </span>
      </div>
      <p className={'text-ink text-5xl font-semibold'} aria-live={'polite'}>
        {formatNumber(snapshot.activeVisitors, locale)}
      </p>
      <div
        className={'h-20 w-full'}
        role={'img'}
        aria-label={t('analyticsViewsPerMinute')}
      >
        <ResponsiveContainer width={'100%'} height={'100%'}>
          <BarChart data={snapshot.perMinute} barCategoryGap={2}>
            <XAxis dataKey={'minutesAgo'} hide reversed />
            <Tooltip
              cursor={{ fill: 'var(--surface-sunken)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 8,
                color: 'var(--ink)',
              }}
              labelFormatter={(value) => `-${String(value)}m`}
            />
            <Bar
              dataKey={'views'}
              fill={'var(--chart-1)'}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className={'type-caption text-ink-muted'}>
        {t('analyticsActivePages')}
      </h3>
      <BarList
        valueLabel={t('analyticsActivePages')}
        format={(value) => formatNumber(value, locale)}
        items={snapshot.activePages.map((page) => ({
          label: page.path,
          value: page.visitors,
        }))}
      />
    </section>
  )
}
