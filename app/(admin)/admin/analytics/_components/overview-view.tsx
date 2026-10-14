'use client'

/** 개요 탭 본문: 지표 타일 6개, 지표를 고르는 추이 차트, 상위 채널·페이지·기기. 데이터는 서버에서 받은 직렬화 값이다. */
import { useState } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import { ReportEmpty } from '@/app/(admin)/admin/analytics/_components/report-states'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { pageDetailHref } from '@/app/(admin)/admin/analytics/_lib/links'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  percentChange,
  type DerivedSessionMetrics,
} from '@/lib/analytics/metrics'
import type { AnalyticsOverview } from '@/lib/server/services/admin/analytics'

type TileKey =
  | 'users'
  | 'newUsers'
  | 'sessions'
  | 'engagementRate'
  | 'avgEngagementSeconds'
  | 'views'

const TILES: Array<{
  key: TileKey
  label: AdminMessageKey
  goodWhenUp: boolean
}> = [
  { key: 'users', label: 'analyticsUsers', goodWhenUp: true },
  { key: 'newUsers', label: 'analyticsNewUsers', goodWhenUp: true },
  { key: 'sessions', label: 'analyticsSessions', goodWhenUp: true },
  { key: 'engagementRate', label: 'analyticsEngagementRate', goodWhenUp: true },
  {
    key: 'avgEngagementSeconds',
    label: 'analyticsAvgEngagement',
    goodWhenUp: true,
  },
  { key: 'views', label: 'analyticsViews', goodWhenUp: true },
]

export default function OverviewView({
  data,
  filter,
}: {
  data: AnalyticsOverview
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const [metric, setMetric] = useState<TileKey>('users')

  if (data.totals.sessions === 0)
    return <ReportEmpty collectingSince={data.collectingSince} />

  const format = (key: TileKey, value: number) =>
    key === 'engagementRate'
      ? formatPercent(value, locale)
      : key === 'avgEngagementSeconds'
        ? formatDuration(value)
        : formatNumber(value, locale)

  const chartData = data.series.map((point, index) => ({
    bucket: point.bucket,
    current: point[metric],
    ...(data.previousSeries
      ? { previous: data.previousSeries[index]?.[metric] ?? 0 }
      : {}),
  }))
  const metricLabel = t(TILES.find((tile) => tile.key === metric)!.label)
  const first = data.series[0]
  const last = data.series.at(-1)

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'}>
        {TILES.map((tile) => (
          <MetricTile
            key={tile.key}
            label={t(tile.label)}
            value={format(tile.key, data.totals[tile.key])}
            delta={
              data.previousTotals
                ? percentChange(
                    data.totals[tile.key],
                    data.previousTotals[tile.key]
                  )
                : null
            }
            goodWhenUp={tile.goodWhenUp}
            spark={data.series.map((point) => point[tile.key])}
          />
        ))}
      </div>

      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${metricLabel}: ${first ? format(metric, first[metric]) : 0} → ${last ? format(metric, last[metric]) : 0}`}
        table={{
          columns: [
            t('analyticsDimDate'),
            metricLabel,
            ...(data.previousSeries ? [t('analyticsPreviousPeriod')] : []),
          ],
          rows: chartData.map((row) => [
            formatBucketLabel(row.bucket, locale),
            format(metric, row.current),
            ...('previous' in row ? [format(metric, row.previous)] : []),
          ]),
        }}
        actions={
          <select
            aria-label={t('analyticsMetric')}
            className={'admin-input min-h-11 w-auto'}
            value={metric}
            onChange={(event) => setMetric(event.target.value as TileKey)}
          >
            {TILES.map((tile) => (
              <option key={tile.key} value={tile.key}>
                {t(tile.label)}
              </option>
            ))}
          </select>
        }
      >
        <TimeSeriesChart
          data={chartData}
          xKey={'bucket'}
          series={[{ key: 'current', label: metricLabel }]}
          compareKey={data.previousSeries ? 'previous' : undefined}
          compareLabel={t('analyticsPreviousPeriod')}
          valueFormat={(value) => format(metric, value)}
        />
      </ChartFrame>

      <div className={'grid gap-4 lg:grid-cols-3'}>
        <TopList
          title={t('analyticsTopChannels')}
          rows={data.channels}
          valueLabel={t('analyticsSessions')}
        />
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsTopPages')}</h2>
          <BarList
            valueLabel={t('analyticsViews')}
            format={(value) => formatNumber(value, locale)}
            items={data.topPages.map((page) => ({
              label: page.title ?? page.path,
              secondary: page.path,
              value: page.views,
              href: pageDetailHref(page.path, filter, locale),
            }))}
          />
        </section>
        <TopList
          title={t('analyticsDevices')}
          rows={data.devices}
          valueLabel={t('analyticsSessions')}
        />
      </div>
    </div>
  )
}

function TopList({
  title,
  rows,
  valueLabel,
}: {
  title: string
  rows: Array<{ name: string } & DerivedSessionMetrics>
  valueLabel: string
}) {
  const { locale } = useAdminI18n()
  return (
    <section className={'admin-card flex flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>{title}</h2>
      <BarList
        valueLabel={valueLabel}
        format={(value) => formatNumber(value, locale)}
        items={rows.map((row) => ({ label: row.name, value: row.sessions }))}
      />
    </section>
  )
}
