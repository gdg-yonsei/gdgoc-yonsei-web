'use client'

/** 페이지 상세: 지표, 조회 추이, 스크롤 깊이, 이전·다음 페이지, 유입 채널. */
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { PageDetail } from '@/lib/server/analytics/queries/pages'

// lib/server/analytics/queries/pages.ts의 ENTRANCE_MARKER·EXIT_MARKER와 같은 값이다.
const ENTRANCE = '(entrance)'
const EXIT = '(exit)'

export default function PageDetailView({
  data,
  path,
}: {
  data: PageDetail
  path: string
}) {
  const { t, locale } = useAdminI18n()
  const flowLabel = (value: string) =>
    value === ENTRANCE
      ? t('analyticsEntranceSource')
      : value === EXIT
        ? t('analyticsExitTarget')
        : value

  return (
    <div className={'flex flex-col gap-4'}>
      <h2 className={'type-heading-2 text-ink break-all'}>{path}</h2>
      <div className={'grid grid-cols-2 gap-3 md:grid-cols-4'}>
        <MetricTile
          label={t('analyticsViews')}
          value={formatNumber(data.totals.views, locale)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsUsers')}
          value={formatNumber(data.totals.users, locale)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsAvgTimeOnPage')}
          value={formatDuration(data.totals.avgEngagementSeconds)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsExitRate')}
          value={formatPercent(data.totals.exitRate, locale)}
          delta={null}
          goodWhenUp={false}
          spark={[]}
        />
      </div>
      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${t('analyticsViews')} ${data.totals.views}`}
        table={{
          columns: [t('analyticsDimDate'), t('analyticsViews')],
          rows: data.series.map((point) => [
            formatBucketLabel(point.bucket, locale),
            point.views,
          ]),
        }}
      >
        <TimeSeriesChart
          data={data.series}
          xKey={'bucket'}
          series={[{ key: 'views', label: t('analyticsViews') }]}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>
      <div className={'grid gap-4 lg:grid-cols-2 xl:grid-cols-4'}>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsScrollDepth')}</h3>
          <BarList
            valueLabel={t('analyticsScrollDepth')}
            format={(value) => formatPercent(value, locale)}
            items={data.scrollDepth.map((step) => ({
              label: `${step.threshold}%`,
              value: step.rate,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>
            {t('analyticsPreviousPages')}
          </h3>
          <BarList
            valueLabel={t('analyticsPreviousPages')}
            format={(value) => formatNumber(value, locale)}
            items={data.previousPages.map((row) => ({
              label: flowLabel(row.path),
              value: row.views,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsNextPages')}</h3>
          <BarList
            valueLabel={t('analyticsNextPages')}
            format={(value) => formatNumber(value, locale)}
            items={data.nextPages.map((row) => ({
              label: flowLabel(row.path),
              value: row.views,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsChannel')}</h3>
          <BarList
            valueLabel={t('analyticsChannel')}
            format={(value) => formatNumber(value, locale)}
            items={data.channels.map((row) => ({
              label: row.channel,
              value: row.views,
            }))}
          />
        </section>
      </div>
    </div>
  )
}
