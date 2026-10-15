'use client'

/** 참여 탭: 페이지 표(상세로 이동), 이벤트 표, 깨진 링크(404). */
import Link from 'next/link'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { pageDetailHref } from '@/app/(admin)/admin/analytics/_lib/links'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { AnalyticsEngagement } from '@/lib/server/services/admin/analytics'

export default function EngagementView({
  data,
  filter,
}: {
  data: AnalyticsEngagement
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const csv = (report: 'pages' | 'events' | 'not_found') => (
    <CsvLink
      report={report}
      filter={filter}
      label={t('analyticsDownloadCsv')}
    />
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <section
        className={'admin-card flex min-w-0 flex-col gap-3'}
        aria-labelledby={'analytics-pages'}
      >
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <h2 id={'analytics-pages'} className={'type-title text-ink'}>
            {t('analyticsPages')}
          </h2>
          {csv('pages')}
        </div>
        <MetricTable
          caption={t('analyticsPages')}
          rows={data.pages}
          rowKey={(row) => row.path}
          columns={[
            {
              key: 'page',
              label: t('analyticsPage'),
              render: (row) => (
                <span className={'flex flex-col'}>
                  <Link
                    href={pageDetailHref(row.path, filter, locale)}
                    className={'text-primary hover:underline'}
                  >
                    {row.title ?? row.path}
                  </Link>
                  <span className={'type-caption text-ink-muted'}>
                    {row.path}
                  </span>
                </span>
              ),
            },
            {
              key: 'views',
              label: t('analyticsViews'),
              numeric: true,
              render: (row) => formatNumber(row.views, locale),
            },
            {
              key: 'users',
              label: t('analyticsUsers'),
              numeric: true,
              render: (row) => formatNumber(row.users, locale),
            },
            {
              key: 'time',
              label: t('analyticsAvgTimeOnPage'),
              numeric: true,
              render: (row) => formatDuration(row.avgEngagementSeconds),
            },
            {
              key: 'scroll',
              label: t('analyticsScroll75'),
              numeric: true,
              render: (row) => formatPercent(row.scroll75Rate, locale),
            },
            {
              key: 'entrances',
              label: t('analyticsEntrances'),
              numeric: true,
              render: (row) => formatNumber(row.entrances, locale),
            },
            {
              key: 'exit',
              label: t('analyticsExitRate'),
              numeric: true,
              render: (row) => formatPercent(row.exitRate, locale),
            },
          ]}
        />
      </section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-labelledby={'analytics-events'}
        >
          <div className={'flex flex-wrap items-center justify-between gap-2'}>
            <h2 id={'analytics-events'} className={'type-title text-ink'}>
              {t('analyticsEvents')}
            </h2>
            {csv('events')}
          </div>
          <MetricTable
            caption={t('analyticsEvents')}
            rows={data.events}
            rowKey={(row) => `${row.name}/${row.label}`}
            columns={[
              {
                key: 'name',
                label: t('analyticsEventName'),
                render: (row) => row.name,
              },
              {
                key: 'label',
                label: t('analyticsEventLabel'),
                render: (row) => row.label,
              },
              {
                key: 'count',
                label: t('analyticsCount'),
                numeric: true,
                render: (row) => formatNumber(row.count, locale),
              },
              {
                key: 'sessions',
                label: t('analyticsSessions'),
                numeric: true,
                render: (row) => formatNumber(row.sessions, locale),
              },
            ]}
          />
        </section>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-labelledby={'analytics-404'}
        >
          <div className={'flex flex-wrap items-center justify-between gap-2'}>
            <h2 id={'analytics-404'} className={'type-title text-ink'}>
              {t('analyticsNotFound')}
            </h2>
            {csv('not_found')}
          </div>
          <MetricTable
            caption={t('analyticsNotFound')}
            rows={data.notFound}
            rowKey={(row) => `${row.path}/${row.referrer}`}
            columns={[
              {
                key: 'path',
                label: t('analyticsPage'),
                render: (row) => row.path,
              },
              {
                key: 'referrer',
                label: t('analyticsReferrer'),
                render: (row) => row.referrer,
              },
              {
                key: 'views',
                label: t('analyticsViews'),
                numeric: true,
                render: (row) => formatNumber(row.views, locale),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
