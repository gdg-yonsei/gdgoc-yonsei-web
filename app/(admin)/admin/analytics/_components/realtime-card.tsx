'use client'

/** 최근 5분 활성 방문자와 30분 분당 조회. 30초마다 실시간 API를 다시 부르고, 실패하면 마지막 값을 유지한다. */
import { useEffect, useState } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import {
  ChartMotion,
  TOOLTIP_PANEL_STYLE,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import { formatNumber } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { Bar } from '@/app/components/admin/charts/bar'
import { BarChart } from '@/app/components/admin/charts/bar-chart'
import { ChartTooltip } from '@/app/components/admin/charts/tooltip'
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

  // 왼쪽이 과거, 오른쪽이 지금이 되도록 오래된 분부터 놓는다.
  const perMinute = [...snapshot.perMinute]
    .sort((a, b) => b.minutesAgo - a.minutesAgo)
    .map((point) => ({ ...point, label: `-${point.minutesAgo}m` }))

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
        <ChartMotion>
          <BarChart
            data={perMinute}
            xDataKey={'label'}
            aspectRatio={''}
            className={'h-full'}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barGap={0.15}
            // 30초마다 값이 바뀌므로 등장 애니메이션을 반복하지 않는다.
            animationDuration={0}
          >
            <Bar
              dataKey={'views'}
              fill={'var(--chart-1)'}
              lineCap={2}
              animate={false}
            />
            <ChartTooltip
              panelStyle={TOOLTIP_PANEL_STYLE}
              rows={(point) => [
                {
                  color: 'var(--chart-1)',
                  label: t('analyticsViews'),
                  value: formatNumber(Number(point.views ?? 0), locale),
                },
              ]}
            />
          </BarChart>
        </ChartMotion>
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
