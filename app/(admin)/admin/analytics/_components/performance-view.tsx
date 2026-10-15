'use client'

/** 성능 탭: Web Vitals 지표별 p75와 등급 분포, LCP·INP·CLS 추이(지표마다 따로 그려 단위를 섞지 않는다), 기기별, 느린 페이지. */
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import RatingBar from '@/app/(admin)/admin/analytics/_components/rating-bar'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatNumber,
  formatVital,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { WebVitalName, WebVitalRating } from '@/lib/analytics/events'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import { rateWebVital } from '@/lib/analytics/metrics'
import type { WebVitalsReport } from '@/lib/server/analytics/queries/vitals'

const RATING_LABEL: Record<WebVitalRating, AdminMessageKey> = {
  good: 'analyticsRatingGood',
  'needs-improvement': 'analyticsRatingNeedsImprovement',
  poor: 'analyticsRatingPoor',
}

const TREND_METRICS: WebVitalName[] = ['LCP', 'INP', 'CLS']

export default function PerformanceView({
  data,
  filter,
}: {
  data: WebVitalsReport
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const labels = {
    good: t('analyticsRatingGood'),
    needsImprovement: t('analyticsRatingNeedsImprovement'),
    poor: t('analyticsRatingPoor'),
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex items-center justify-between gap-2'}>
        <h2 className={'type-title text-ink'}>{t('analyticsWebVitals')}</h2>
        <CsvLink
          report={'web_vitals'}
          filter={filter}
          label={t('analyticsDownloadCsv')}
        />
      </div>
      <div className={'grid gap-3 md:grid-cols-2 xl:grid-cols-5'}>
        {data.summary.map((row) => (
          <section
            key={row.metric}
            aria-label={row.metric}
            className={'admin-card flex flex-col gap-2'}
          >
            <span className={'type-caption text-ink-muted'}>{row.metric}</span>
            <span className={'type-heading-1 text-ink'}>
              {formatVital(row.metric, row.p75)}
            </span>
            {row.p75 !== null && (
              <span className={'type-caption text-ink-secondary'}>
                {t(RATING_LABEL[rateWebVital(row.metric, row.p75)])}
              </span>
            )}
            <RatingBar
              good={row.good}
              needsImprovement={row.needsImprovement}
              poor={row.poor}
              labels={labels}
            />
            <span className={'type-caption text-ink-muted'}>
              {t('analyticsSamples')} {formatNumber(row.samples, locale)}
            </span>
          </section>
        ))}
      </div>

      <div className={'grid gap-4 xl:grid-cols-3'}>
        {TREND_METRICS.map((metric) => {
          const points = data.series.filter((point) => point.metric === metric)
          return (
            <ChartFrame
              key={metric}
              title={`${metric} ${t('analyticsTrend')}`}
              summary={`${metric} p75 ${points.map((point) => formatVital(metric, point.p75)).join(', ')}`}
              table={{
                columns: [t('analyticsDimDate'), `${metric} p75`],
                rows: points.map((point) => [
                  formatBucketLabel(point.bucket, locale),
                  formatVital(metric, point.p75),
                ]),
              }}
            >
              <TimeSeriesChart
                data={points.map((point) => ({
                  bucket: point.bucket,
                  p75: point.p75,
                }))}
                xKey={'bucket'}
                series={[{ key: 'p75', label: `${metric} p75` }]}
                valueFormat={(value) => formatVital(metric, value)}
                height={200}
              />
            </ChartFrame>
          )
        })}
      </div>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsByDevice')}</h2>
          <MetricTable
            caption={t('analyticsByDevice')}
            rows={data.byDevice}
            rowKey={(row) => `${row.deviceType}/${row.metric}`}
            columns={[
              {
                key: 'device',
                label: t('analyticsDevice'),
                render: (row) => row.deviceType,
              },
              {
                key: 'metric',
                label: t('analyticsMetric'),
                render: (row) => row.metric,
              },
              {
                key: 'p75',
                label: 'p75',
                numeric: true,
                render: (row) => formatVital(row.metric, row.p75),
              },
              {
                key: 'samples',
                label: t('analyticsSamples'),
                numeric: true,
                render: (row) => formatNumber(row.samples, locale),
              },
            ]}
          />
        </section>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>
            {t('analyticsSlowestPages')}
          </h2>
          <MetricTable
            caption={t('analyticsSlowestPages')}
            rows={data.slowestPages}
            rowKey={(row) => `${row.path}/${row.metric}`}
            columns={[
              {
                key: 'path',
                label: t('analyticsPage'),
                render: (row) => row.path,
              },
              {
                key: 'metric',
                label: t('analyticsMetric'),
                render: (row) => row.metric,
              },
              {
                key: 'p75',
                label: 'p75',
                numeric: true,
                render: (row) => formatVital(row.metric, row.p75),
              },
              {
                key: 'samples',
                label: t('analyticsSamples'),
                numeric: true,
                render: (row) => formatNumber(row.samples, locale),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
