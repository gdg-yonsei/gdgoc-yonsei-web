'use client'

/** 페이지 상세: 지표, 조회 추이, 이전→이 페이지→다음 흐름(Sankey), 스크롤 깊이 깔때기, 유입 채널. */
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import PageFlowSankey from '@/app/(admin)/admin/analytics/_components/page-flow-sankey'
import ScrollFunnel from '@/app/(admin)/admin/analytics/_components/scroll-funnel'
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

  const previous = data.previousPages.map((row) => ({
    label: flowLabel(row.path),
    value: row.views,
  }))
  const next = data.nextPages.map((row) => ({
    label: flowLabel(row.path),
    value: row.views,
  }))

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
      <ChartFrame
        title={t('analyticsPageFlow')}
        summary={`${t('analyticsPreviousPages')}: ${previous.map((row) => row.label).join(', ')}. ${t('analyticsNextPages')}: ${next.map((row) => row.label).join(', ')}`}
        table={{
          columns: ['', t('analyticsPage'), t('analyticsViews')],
          rows: [
            ...previous.map((row) => [
              t('analyticsPreviousPages'),
              row.label,
              formatNumber(row.value, locale),
            ]),
            ...next.map((row) => [
              t('analyticsNextPages'),
              row.label,
              formatNumber(row.value, locale),
            ]),
          ],
        }}
      >
        {/* 좁은 화면에서는 양쪽 경로 라벨이 흐름을 짓눌러, 같은 데이터를 순위 목록 두 개로 보여 준다. */}
        <div className={'hidden sm:block'}>
          <PageFlowSankey
            page={path}
            previous={previous}
            next={next}
            valueLabel={t('analyticsViews')}
            format={(value) => formatNumber(value, locale)}
          />
        </div>
        <div className={'flex flex-col gap-4 sm:hidden'}>
          {[
            { title: t('analyticsPreviousPages'), rows: previous },
            { title: t('analyticsNextPages'), rows: next },
          ].map((group) => (
            <div key={group.title} className={'flex flex-col gap-2'}>
              <h3 className={'type-caption text-ink-muted'}>{group.title}</h3>
              <BarList
                valueLabel={group.title}
                format={(value) => formatNumber(value, locale)}
                items={group.rows}
              />
            </div>
          ))}
        </div>
      </ChartFrame>
      <div className={'grid gap-4 lg:grid-cols-2'}>
        <ChartFrame
          title={t('analyticsScrollDepth')}
          summary={data.scrollDepth
            .map(
              (step) => `${step.threshold}% ${formatPercent(step.rate, locale)}`
            )
            .join(', ')}
          table={{
            columns: [t('analyticsScrollDepth'), t('analyticsViews')],
            rows: data.scrollDepth.map((step) => [
              `${step.threshold}%`,
              formatPercent(step.rate, locale),
            ]),
          }}
        >
          <ScrollFunnel
            steps={data.scrollDepth}
            format={(value) => formatPercent(value, locale)}
          />
        </ChartFrame>
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
