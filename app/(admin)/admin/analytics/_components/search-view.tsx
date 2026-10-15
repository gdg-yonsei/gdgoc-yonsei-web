'use client'

/**
 * 검색 탭: Search Console 지표·추이·검색어·페이지·기기·국가와 개선 기회 세 목록.
 * 클릭과 노출은 규모가 달라 한 차트에 두 축으로 그리지 않고 지표를 골라 본다.
 */
import { useState } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import { percentChange } from '@/lib/analytics/metrics'
import type { SearchMetrics } from '@/lib/analytics/seo'
import { fillTemplate } from '@/lib/format/text'
import type {
  SearchConsoleOverview,
  SeoOpportunities,
} from '@/lib/server/services/admin/search-console'

type MetricKey = keyof SearchMetrics

const TILES: Array<{
  key: MetricKey
  label: AdminMessageKey
  goodWhenUp: boolean
}> = [
  { key: 'clicks', label: 'analyticsSearchClicks', goodWhenUp: true },
  { key: 'impressions', label: 'analyticsSearchImpressions', goodWhenUp: true },
  { key: 'ctr', label: 'analyticsSearchCtr', goodWhenUp: true },
  // 순위는 숫자가 작을수록 좋다.
  { key: 'position', label: 'analyticsSearchPosition', goodWhenUp: false },
]

function SetupGuide() {
  const { t } = useAdminI18n()
  const steps: AdminMessageKey[] = [
    'analyticsSearchSetupStep1',
    'analyticsSearchSetupStep2',
    'analyticsSearchSetupStep3',
    'analyticsSearchSetupStep4',
  ]
  return (
    <section className={'admin-card flex max-w-3xl flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>
        {t('analyticsSearchSetupTitle')}
      </h2>
      <p className={'type-body-sm text-ink-muted'}>
        {t('analyticsSearchSetupIntro')}
      </p>
      <ol
        className={
          'type-body-sm text-ink flex list-decimal flex-col gap-2 pl-5'
        }
      >
        {steps.map((step) => (
          <li key={step}>{t(step)}</li>
        ))}
      </ol>
    </section>
  )
}

function Opportunity({
  title,
  hint,
  children,
  empty,
}: {
  title: string
  hint: string
  children: React.ReactNode
  empty: boolean
}) {
  const { t } = useAdminI18n()
  return (
    <section
      aria-label={title}
      className={'admin-card flex min-w-0 flex-col gap-2'}
    >
      <h3 className={'type-title text-ink'}>{title}</h3>
      <p className={'type-caption text-ink-muted'}>{hint}</p>
      {empty ? (
        <p className={'type-body-sm text-ink-muted'}>{t('analyticsSeoNone')}</p>
      ) : (
        children
      )}
    </section>
  )
}

export default function SearchView({
  overview,
  opportunities,
}: {
  overview: SearchConsoleOverview
  opportunities: SeoOpportunities
}) {
  const { t, locale } = useAdminI18n()
  const [metric, setMetric] = useState<MetricKey>('clicks')

  if (!overview.configured) return <SetupGuide />

  const format = (key: MetricKey, value: number) =>
    key === 'ctr'
      ? formatPercent(value, locale)
      : key === 'position'
        ? value.toFixed(1)
        : formatNumber(value, locale)
  const metricLabel = t(TILES.find((tile) => tile.key === metric)!.label)
  const searchColumns = <T extends SearchMetrics>() => [
    {
      key: 'clicks',
      label: t('analyticsSearchClicks'),
      numeric: true,
      render: (row: T) => formatNumber(row.clicks, locale),
    },
    {
      key: 'impressions',
      label: t('analyticsSearchImpressions'),
      numeric: true,
      render: (row: T) => formatNumber(row.impressions, locale),
    },
    {
      key: 'ctr',
      label: t('analyticsSearchCtr'),
      numeric: true,
      render: (row: T) => formatPercent(row.ctr, locale),
    },
    {
      key: 'position',
      label: t('analyticsSearchPosition'),
      numeric: true,
      render: (row: T) => row.position.toFixed(1),
    },
  ]

  return (
    <div className={'flex flex-col gap-4'}>
      <p className={'type-caption text-ink-muted flex flex-wrap gap-x-2'}>
        <span>
          {fillTemplate(t('analyticsSearchDataThrough'), {
            date: overview.dataThrough,
          })}
        </span>
        <span>{t('analyticsSearchFilterNote')}</span>
      </p>
      <div className={'grid grid-cols-2 gap-3 xl:grid-cols-4'}>
        {TILES.map((tile) => (
          <MetricTile
            key={tile.key}
            label={t(tile.label)}
            value={format(tile.key, overview.totals[tile.key])}
            delta={
              overview.previousTotals
                ? percentChange(
                    overview.totals[tile.key],
                    overview.previousTotals[tile.key]
                  )
                : null
            }
            goodWhenUp={tile.goodWhenUp}
            spark={overview.series.map((point) => point[tile.key])}
          />
        ))}
      </div>

      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${metricLabel} ${overview.series.map((point) => format(metric, point[metric])).join(', ')}`}
        table={{
          columns: [t('analyticsDimDate'), metricLabel],
          rows: overview.series.map((point) => [
            formatBucketLabel(point.date, locale),
            format(metric, point[metric]),
          ]),
        }}
        actions={
          <select
            aria-label={t('analyticsMetric')}
            className={'admin-input min-h-11 w-auto'}
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricKey)}
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
          data={overview.series}
          xKey={'date'}
          series={[{ key: metric, label: metricLabel }]}
          valueFormat={(value) => format(metric, value)}
        />
      </ChartFrame>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>
            {t('analyticsSearchQueries')}
          </h2>
          <MetricTable
            caption={t('analyticsSearchQueries')}
            rows={overview.queries}
            rowKey={(row) => row.query}
            columns={[
              {
                key: 'query',
                label: t('analyticsSearchQuery'),
                render: (row) => row.query,
              },
              ...searchColumns<(typeof overview.queries)[number]>(),
            ]}
          />
        </section>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsSearchPages')}</h2>
          <MetricTable
            caption={t('analyticsSearchPages')}
            rows={overview.pages}
            rowKey={(row) => row.page}
            columns={[
              {
                key: 'page',
                label: t('analyticsPage'),
                render: (row) => row.page,
              },
              ...searchColumns<(typeof overview.pages)[number]>(),
            ]}
          />
        </section>
      </div>

      <div className={'grid gap-4 md:grid-cols-2'}>
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsDevices')}</h2>
          <BarList
            valueLabel={t('analyticsSearchClicks')}
            format={(value) => formatNumber(value, locale)}
            items={overview.devices.map((row) => ({
              label: row.device,
              value: row.clicks,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsCountries')}</h2>
          <BarList
            valueLabel={t('analyticsSearchClicks')}
            format={(value) => formatNumber(value, locale)}
            items={overview.countries.map((row) => ({
              label: row.country,
              value: row.clicks,
            }))}
          />
        </section>
      </div>

      {opportunities.configured && (
        <section
          className={'flex flex-col gap-3'}
          aria-labelledby={'seo-opportunities'}
        >
          <h2 id={'seo-opportunities'} className={'type-heading-2 text-ink'}>
            {t('analyticsSeoOpportunities')}
          </h2>
          <div className={'grid gap-4 xl:grid-cols-3'}>
            <Opportunity
              title={t('analyticsSeoLowCtr')}
              hint={t('analyticsSeoLowCtrHint')}
              empty={opportunities.lowCtr.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoLowCtr')}
                rows={opportunities.lowCtr}
                rowKey={(row) => `${row.query}/${row.page}`}
                columns={[
                  {
                    key: 'query',
                    label: t('analyticsSearchQuery'),
                    render: (row) => `${row.query} · ${row.page}`,
                  },
                  {
                    key: 'impressions',
                    label: t('analyticsSearchImpressions'),
                    numeric: true,
                    render: (row) => formatNumber(row.impressions, locale),
                  },
                  {
                    key: 'ctr',
                    label: t('analyticsSearchCtr'),
                    numeric: true,
                    render: (row) => formatPercent(row.ctr, locale),
                  },
                  {
                    key: 'expected',
                    label: t('analyticsSeoExpectedCtr'),
                    numeric: true,
                    render: (row) => formatPercent(row.expectedCtr, locale),
                  },
                ]}
              />
            </Opportunity>
            <Opportunity
              title={t('analyticsSeoStriking')}
              hint={t('analyticsSeoStrikingHint')}
              empty={opportunities.strikingDistance.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoStriking')}
                rows={opportunities.strikingDistance}
                rowKey={(row) => `${row.query}/${row.page}`}
                columns={[
                  {
                    key: 'query',
                    label: t('analyticsSearchQuery'),
                    render: (row) => `${row.query} · ${row.page}`,
                  },
                  {
                    key: 'position',
                    label: t('analyticsSearchPosition'),
                    numeric: true,
                    render: (row) => row.position.toFixed(1),
                  },
                  {
                    key: 'impressions',
                    label: t('analyticsSearchImpressions'),
                    numeric: true,
                    render: (row) => formatNumber(row.impressions, locale),
                  },
                ]}
              />
            </Opportunity>
            <Opportunity
              title={t('analyticsSeoLowEngagement')}
              hint={t('analyticsSeoLowEngagementHint')}
              empty={opportunities.lowEngagementLandings.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoLowEngagement')}
                rows={opportunities.lowEngagementLandings}
                rowKey={(row) => row.path}
                columns={[
                  {
                    key: 'path',
                    label: t('analyticsPage'),
                    render: (row) => row.path,
                  },
                  {
                    key: 'sessions',
                    label: t('analyticsSessions'),
                    numeric: true,
                    render: (row) => formatNumber(row.sessions, locale),
                  },
                  {
                    key: 'rate',
                    label: t('analyticsEngagementRate'),
                    numeric: true,
                    render: (row) => formatPercent(row.engagementRate, locale),
                  },
                  {
                    key: 'time',
                    label: t('analyticsAvgEngagement'),
                    numeric: true,
                    render: (row) => formatDuration(row.avgEngagementSeconds),
                  },
                ]}
              />
            </Opportunity>
          </div>
        </section>
      )}
    </div>
  )
}
