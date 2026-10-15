'use client'

/**
 * 사용자 탭: 신규·재방문 누적 막대(합계와 구성을 한 번에), 주간 리텐션, 요일×시간 히트맵, 기기 비중 도넛,
 * 브라우저·OS·화면·언어·국가 순위 목록. 국가는 눌러서 필터로 건다.
 */
import { usePathname } from 'next/navigation'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import HourHeatmap from '@/app/(admin)/admin/analytics/_components/hour-heatmap'
import ShareDonut from '@/app/(admin)/admin/analytics/_components/share-donut'
import StackedBarChart from '@/app/(admin)/admin/analytics/_components/stacked-bar-chart'
import {
  formatBucketLabel,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { DerivedSessionMetrics } from '@/lib/analytics/metrics'
import { fillTemplate } from '@/lib/format/text'
import type { AnalyticsAudience } from '@/lib/server/services/admin/analytics'

type Named = { name: string } & DerivedSessionMetrics

export default function AudienceView({
  data,
  filter,
}: {
  data: AnalyticsAudience
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const pathname = usePathname()
  const weekdays = t('analyticsWeekdays').split(',')
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour))
  const heat = weekdays.map((_, weekday) =>
    hours.map(
      (_, hour) =>
        data.hourWeekday.find(
          (cell) => cell.weekday === weekday && cell.hour === hour
        )?.sessions ?? 0
    )
  )
  // 요약 문장은 가장 붐비는 칸 하나를 말한다. 표 보기에 전체 값이 있다.
  const peak = heat.reduce(
    (best, values, row) =>
      values.reduce(
        (inner, value, hour) =>
          value > inner.value
            ? { weekday: weekdays[row] ?? '', hour: hours[hour] ?? '', value }
            : inner,
        best
      ),
    { weekday: '', hour: '', value: 0 }
  )
  const maxWeeks = Math.max(1, ...data.retention.map((row) => row.rates.length))
  const weekLabels = Array.from({ length: maxWeeks }, (_, week) =>
    fillTemplate(t('analyticsWeekN'), { n: week })
  )
  const countryHref = (country: string) =>
    `${pathname}?${analyticsFilterToSearchParams({ ...filter, country }).toString()}`

  const list = (
    title: string,
    rows: Named[],
    href?: (name: string) => string
  ) => (
    <section className={'admin-card flex min-w-0 flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>{title}</h2>
      <BarList
        valueLabel={t('analyticsUsers')}
        format={(value) => formatNumber(value, locale)}
        items={rows.map((row) => ({
          label: row.name,
          value: row.users,
          href: href?.(row.name),
        }))}
      />
    </section>
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <ChartFrame
        title={t('analyticsNewVsReturning')}
        summary={`${t('analyticsNewUsers')} ${data.newVsReturning.reduce((sum, row) => sum + row.newUsers, 0)}, ${t('analyticsReturningUsers')} ${data.newVsReturning.reduce((sum, row) => sum + row.returningUsers, 0)}`}
        table={{
          columns: [
            t('analyticsDimDate'),
            t('analyticsNewUsers'),
            t('analyticsReturningUsers'),
          ],
          rows: data.newVsReturning.map((row) => [
            formatBucketLabel(row.bucket, locale),
            row.newUsers,
            row.returningUsers,
          ]),
        }}
      >
        <StackedBarChart
          data={data.newVsReturning}
          xKey={'bucket'}
          series={[
            { key: 'newUsers', label: t('analyticsNewUsers') },
            { key: 'returningUsers', label: t('analyticsReturningUsers') },
          ]}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsRetention')}</h2>
          <div className={'overflow-x-auto'}>
            <table
              className={'type-caption border-separate border-spacing-0.5'}
            >
              <thead>
                <tr>
                  <th
                    scope={'col'}
                    className={
                      'text-ink-muted pr-2 text-left font-normal whitespace-nowrap'
                    }
                  >
                    {t('analyticsCohort')}
                  </th>
                  <th
                    scope={'col'}
                    className={
                      'text-ink-muted px-1 font-normal whitespace-nowrap'
                    }
                  >
                    {t('analyticsUsers')}
                  </th>
                  {weekLabels.map((label) => (
                    <th
                      key={label}
                      scope={'col'}
                      className={
                        'text-ink-muted px-1 font-normal whitespace-nowrap'
                      }
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.retention.map((row) => (
                  <tr key={row.cohort}>
                    <th
                      scope={'row'}
                      className={
                        'text-ink pr-2 text-left font-normal whitespace-nowrap tabular-nums'
                      }
                    >
                      {row.cohort}
                    </th>
                    <td className={'text-ink px-1 text-right tabular-nums'}>
                      {row.size}
                    </td>
                    {weekLabels.map((label, week) => {
                      const rate = row.rates[week]
                      const level =
                        rate === undefined
                          ? 0
                          : Math.max(1, Math.ceil(rate * 5))
                      return (
                        <td
                          key={label}
                          aria-label={
                            rate === undefined
                              ? undefined
                              : `${row.cohort} ${label}: ${formatPercent(rate, locale)}`
                          }
                          className={
                            'min-w-12 rounded-[3px] px-1 py-1 text-center tabular-nums'
                          }
                          style={{
                            background:
                              rate === undefined
                                ? 'transparent'
                                : `var(--chart-seq-${level})`,
                            color: level >= 4 ? 'var(--surface)' : 'var(--ink)',
                          }}
                        >
                          {rate === undefined
                            ? ''
                            : formatPercent(rate, locale)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <ChartFrame
          title={t('analyticsTrafficByHour')}
          summary={`${t('analyticsTrafficByHour')}: ${peak.weekday} ${peak.hour}, ${formatNumber(peak.value, locale)}`}
          table={{
            columns: ['', ...hours],
            rows: weekdays.map((weekday, row) => [
              weekday,
              ...(heat[row] ?? []).map((value) => formatNumber(value, locale)),
            ]),
          }}
        >
          <HourHeatmap
            rows={weekdays}
            columns={hours}
            values={heat}
            format={(value) => formatNumber(value, locale)}
            lessLabel={t('analyticsLess')}
            moreLabel={t('analyticsMore')}
          />
        </ChartFrame>
      </div>

      <div className={'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsDevices')}</h2>
          <ShareDonut
            items={data.devices.map((row) => ({
              label: row.name,
              value: row.users,
            }))}
            totalLabel={t('analyticsUsers')}
            otherLabel={t('analyticsOther')}
            format={(value) => formatNumber(value, locale)}
          />
        </section>
        {list(t('analyticsBrowsers'), data.browsers)}
        {list(t('analyticsOperatingSystems'), data.operatingSystems)}
        {list(t('analyticsScreens'), data.screens)}
        {list(t('analyticsLanguages'), data.languages)}
        {list(t('analyticsCountries'), data.countries, countryHref)}
      </div>
    </div>
  )
}
