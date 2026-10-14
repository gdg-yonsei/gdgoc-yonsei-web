'use client'

/** 유입 탭: 채널별 세션 추이, 채널 표, 검색 엔진·AI 어시스턴트, 소스/매체, 참조 사이트, 캠페인, 방문 시작 페이지. */
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable, {
  type MetricColumn,
} from '@/app/(admin)/admin/analytics/_components/metric-table'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { DerivedSessionMetrics } from '@/lib/analytics/metrics'
import type {
  AnalyticsAcquisition,
  AnalyticsTableReport,
} from '@/lib/server/services/admin/analytics'

function Section({
  title,
  report,
  filter,
  children,
}: {
  title: string
  report: AnalyticsTableReport
  filter: AnalyticsFilter
  children: React.ReactNode
}) {
  const { t } = useAdminI18n()
  const id = `analytics-section-${report}`
  return (
    <section
      className={'admin-card flex min-w-0 flex-col gap-3'}
      aria-labelledby={id}
    >
      <div className={'flex flex-wrap items-center justify-between gap-2'}>
        <h2 id={id} className={'type-title text-ink'}>
          {title}
        </h2>
        <CsvLink
          report={report}
          filter={filter}
          label={t('analyticsDownloadCsv')}
        />
      </div>
      {children}
    </section>
  )
}

export default function AcquisitionView({
  data,
  filter,
}: {
  data: AnalyticsAcquisition
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()

  function metricColumns<T extends DerivedSessionMetrics>(): Array<
    MetricColumn<T>
  > {
    return [
      {
        key: 'users',
        label: t('analyticsUsers'),
        numeric: true,
        render: (row) => formatNumber(row.users, locale),
      },
      {
        key: 'sessions',
        label: t('analyticsSessions'),
        numeric: true,
        render: (row) => formatNumber(row.sessions, locale),
      },
      {
        key: 'engagementRate',
        label: t('analyticsEngagementRate'),
        numeric: true,
        render: (row) => formatPercent(row.engagementRate, locale),
      },
      {
        key: 'avg',
        label: t('analyticsAvgEngagement'),
        numeric: true,
        render: (row) => formatDuration(row.avgEngagementSeconds),
      },
      {
        key: 'keyEvents',
        label: t('analyticsKeyEvents'),
        numeric: true,
        render: (row) => formatNumber(row.keyEvents, locale),
      },
    ]
  }

  const searchAndAi = data.sources.filter(
    (row) => row.channel === 'Organic Search' || row.channel === 'AI Assistants'
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <ChartFrame
        title={t('analyticsChannelsOverTime')}
        summary={data.channels
          .map((row) => `${row.name} ${row.sessions}`)
          .join(', ')}
        table={{
          columns: [t('analyticsDimDate'), ...data.channelOrder],
          rows: data.channelSeries.map((point) => [
            formatBucketLabel(String(point.bucket), locale),
            ...data.channelOrder.map((name) => Number(point[name] ?? 0)),
          ]),
        }}
      >
        <TimeSeriesChart
          data={data.channelSeries}
          xKey={'bucket'}
          series={data.channelOrder.map((name) => ({ key: name, label: name }))}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>

      <Section
        title={t('analyticsChannel')}
        report={'channels'}
        filter={filter}
      >
        <MetricTable
          caption={t('analyticsChannel')}
          rows={data.channels}
          rowKey={(row) => row.name}
          columns={[
            {
              key: 'name',
              label: t('analyticsChannel'),
              render: (row) => row.name,
            },
            ...metricColumns(),
          ]}
        />
      </Section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-label={t('analyticsSearchAndAi')}
        >
          <h2 className={'type-title text-ink'}>{t('analyticsSearchAndAi')}</h2>
          <MetricTable
            caption={t('analyticsSearchAndAi')}
            rows={searchAndAi}
            rowKey={(row) => `${row.source}/${row.medium}`}
            columns={[
              {
                key: 'source',
                label: t('analyticsDimSource'),
                render: (row) => row.source,
              },
              {
                key: 'channel',
                label: t('analyticsChannel'),
                render: (row) => row.channel,
              },
              ...metricColumns<(typeof searchAndAi)[number]>().slice(1, 3),
            ]}
          />
        </section>
        <Section
          title={t('analyticsReferrers')}
          report={'referrers'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsReferrers')}
            rows={data.referrers}
            rowKey={(row) => row.name}
            columns={[
              {
                key: 'name',
                label: t('analyticsDimReferrer'),
                render: (row) => row.name,
              },
              ...metricColumns().slice(1, 3),
            ]}
          />
        </Section>
      </div>

      <Section
        title={t('analyticsSourceMedium')}
        report={'sources'}
        filter={filter}
      >
        <MetricTable
          caption={t('analyticsSourceMedium')}
          rows={data.sources}
          rowKey={(row) => `${row.source}/${row.medium}/${row.channel}`}
          columns={[
            {
              key: 'sm',
              label: t('analyticsSourceMedium'),
              render: (row) => `${row.source} / ${row.medium}`,
            },
            ...metricColumns<(typeof data.sources)[number]>(),
          ]}
        />
      </Section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <Section
          title={t('analyticsCampaigns')}
          report={'campaigns'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsCampaigns')}
            rows={data.campaigns}
            rowKey={(row) => `${row.campaign}/${row.source}/${row.medium}`}
            columns={[
              {
                key: 'campaign',
                label: t('analyticsDimCampaign'),
                render: (row) =>
                  `${row.campaign} (${row.source} / ${row.medium})`,
              },
              ...metricColumns<(typeof data.campaigns)[number]>().slice(1, 3),
            ]}
          />
        </Section>
        <Section
          title={t('analyticsLandingPages')}
          report={'landing_pages'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsLandingPages')}
            rows={data.landingPages}
            rowKey={(row) => row.name}
            columns={[
              {
                key: 'path',
                label: t('analyticsDimLandingPath'),
                render: (row) => row.name,
              },
              ...metricColumns().slice(1, 4),
            ]}
          />
        </Section>
      </div>
    </div>
  )
}
