'use client'

/**
 * 탐색: 차원 1~2개 × 지표 여러 개를 골라 표로 본다(GA4 자유 형식 탐색 대응). 고른 값은 URL(dims, metrics)에 저장한다.
 * 첫 지표는 막대 목록으로도 보여 준다. 모든 데이터는 표와 CSV로 볼 수 있다.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { SessionMetricKey } from '@/lib/analytics/metrics'
import type {
  AnalyticsTable,
  ExploreInput,
} from '@/lib/server/services/admin/analytics'

const DIMENSION_LABELS: Record<string, AdminMessageKey> = {
  date: 'analyticsDimDate',
  channel: 'analyticsChannel',
  source: 'analyticsDimSource',
  medium: 'analyticsDimMedium',
  campaign: 'analyticsDimCampaign',
  referrer: 'analyticsDimReferrer',
  landingPath: 'analyticsDimLandingPath',
  landingGroup: 'analyticsDimLandingGroup',
  deviceType: 'analyticsDevice',
  browser: 'analyticsDimBrowser',
  os: 'analyticsDimOs',
  screen: 'analyticsDimScreen',
  country: 'analyticsCountry',
  language: 'analyticsDimLanguage',
  visitorType: 'analyticsVisitorType',
  weekday: 'analyticsDimWeekday',
  hour: 'analyticsDimHour',
}

const METRIC_LABELS: Record<SessionMetricKey, AdminMessageKey> = {
  users: 'analyticsUsers',
  newUsers: 'analyticsNewUsers',
  sessions: 'analyticsSessions',
  engagedSessions: 'analyticsEngagedSessions',
  engagementRate: 'analyticsEngagementRate',
  bounceRate: 'analyticsBounceRate',
  views: 'analyticsViews',
  viewsPerSession: 'analyticsViewsPerSession',
  avgEngagementSeconds: 'analyticsAvgEngagement',
  keyEvents: 'analyticsKeyEvents',
}

export default function ExploreView({
  table,
  explore,
  filter,
  dimensionOptions,
  metricOptions,
}: {
  table: AnalyticsTable
  explore: ExploreInput
  filter: AnalyticsFilter
  dimensionOptions: readonly string[]
  metricOptions: readonly SessionMetricKey[]
}) {
  const { t, locale } = useAdminI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [first, setFirst] = useState<string>(explore.dimensions[0] ?? 'channel')
  const [second, setSecond] = useState<string>(explore.dimensions[1] ?? '')
  const [metrics, setMetrics] = useState<SessionMetricKey[]>(explore.metrics)

  function apply() {
    const params = new URLSearchParams(searchParams)
    params.set('dims', [first, second].filter(Boolean).join(','))
    params.set('metrics', metrics.join(','))
    startTransition(() =>
      router.replace(`${pathname}?${params}`, { scroll: false })
    )
  }

  const formatMetric = (metric: string, value: number) =>
    metric === 'engagementRate' || metric === 'bounceRate'
      ? formatPercent(value, locale)
      : metric === 'avgEngagementSeconds'
        ? formatDuration(value)
        : formatNumber(value, locale)
  const label = (column: string) =>
    t(
      DIMENSION_LABELS[column] ??
        METRIC_LABELS[column as SessionMetricKey] ??
        'analyticsMetric'
    )
  const firstMetric = explore.metrics[0]!

  return (
    <div className={'flex flex-col gap-4'}>
      <section
        className={'admin-card flex flex-wrap items-end gap-3'}
        aria-busy={pending}
      >
        <label className={'flex min-w-44 flex-col gap-1'}>
          <span className={'admin-field-label'}>
            {t('analyticsExploreDimensions')}
          </span>
          <select
            className={'admin-input min-h-11'}
            value={first}
            onChange={(event) => setFirst(event.target.value)}
          >
            {dimensionOptions.map((dimension) => (
              <option key={dimension} value={dimension}>
                {label(dimension)}
              </option>
            ))}
          </select>
        </label>
        <label className={'flex min-w-44 flex-col gap-1'}>
          <span className={'admin-field-label'}>
            {t('analyticsExploreSecondDimension')}
          </span>
          <select
            className={'admin-input min-h-11'}
            value={second}
            onChange={(event) => setSecond(event.target.value)}
          >
            <option value={''}>{t('analyticsNone')}</option>
            {dimensionOptions
              .filter((dimension) => dimension !== first)
              .map((dimension) => (
                <option key={dimension} value={dimension}>
                  {label(dimension)}
                </option>
              ))}
          </select>
        </label>
        <fieldset className={'flex flex-wrap gap-x-4 gap-y-1'}>
          <legend className={'admin-field-label mb-1'}>
            {t('analyticsExploreMetrics')}
          </legend>
          {metricOptions.map((metric) => (
            <label
              key={metric}
              className={
                'type-body-sm text-ink flex min-h-11 items-center gap-2'
              }
            >
              <input
                type={'checkbox'}
                checked={metrics.includes(metric)}
                onChange={(event) =>
                  setMetrics((current) =>
                    event.target.checked
                      ? [...current, metric]
                      : current.filter((item) => item !== metric)
                  )
                }
              />
              {t(METRIC_LABELS[metric])}
            </label>
          ))}
        </fieldset>
        <button
          type={'button'}
          className={'admin-btn-primary'}
          onClick={apply}
          disabled={metrics.length === 0}
        >
          {t('analyticsExploreApply')}
        </button>
      </section>

      <section className={'admin-card flex min-w-0 flex-col gap-3'}>
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <h2 className={'type-title text-ink'}>
            {t(METRIC_LABELS[firstMetric])}
          </h2>
          <CsvLink
            report={'explore'}
            filter={filter}
            label={t('analyticsDownloadCsv')}
            extra={{
              dims: explore.dimensions.join(','),
              metrics: explore.metrics.join(','),
            }}
          />
        </div>
        <BarList
          valueLabel={t(METRIC_LABELS[firstMetric])}
          format={(value) => formatMetric(firstMetric, value)}
          items={table.rows.slice(0, 15).map((row) => ({
            label: explore.dimensions
              .map((dimension) => String(row[dimension] ?? ''))
              .join(' · '),
            value: Number(row[firstMetric] ?? 0),
          }))}
        />
        <MetricTable
          caption={t('analyticsTabExplore')}
          rows={table.rows}
          rowKey={(row) =>
            explore.dimensions
              .map((dimension) => String(row[dimension]))
              .join('/')
          }
          columns={table.columns.map((column) => {
            const isMetric = (explore.metrics as string[]).includes(column)
            return {
              key: column,
              label: label(column),
              numeric: isMetric,
              render: (row: AnalyticsTable['rows'][number]) =>
                isMetric
                  ? formatMetric(column, Number(row[column] ?? 0))
                  : String(row[column] ?? ''),
            }
          })}
        />
      </section>
    </div>
  )
}
