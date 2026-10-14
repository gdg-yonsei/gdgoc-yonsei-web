'use client'

/**
 * 시간 추이 선 차트. 시리즈 색은 넘긴 순서대로 --chart-1..8을 고정 배정한다(필터로 순서가 바뀌어도 같은 이름은
 * 호출부가 같은 순서로 넘긴다). 비교 기간은 점선 대신 회색 실선이다. 축은 하나만 쓴다.
 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useReducedMotion } from 'motion/react'
import { formatBucketLabel } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export type SeriesSpec = { key: string; label: string }

export default function TimeSeriesChart({
  data,
  series,
  xKey,
  valueFormat,
  compareKey,
  compareLabel,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  series: SeriesSpec[]
  xKey: string
  valueFormat: (value: number) => string
  compareKey?: string
  compareLabel?: string
  height?: number
}) {
  const { locale } = useAdminI18n()
  const reduceMotion = useReducedMotion() ?? false
  const showLegend = series.length + (compareKey ? 1 : 0) > 1

  return (
    <div style={{ height }} className={'w-full'}>
      <ResponsiveContainer width={'100%'} height={'100%'}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={'var(--chart-grid)'} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={(value: string) => formatBucketLabel(value, locale)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--hairline)' }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => valueFormat(value)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--control-border)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 8,
              color: 'var(--ink)',
            }}
            labelFormatter={(value) =>
              typeof value === 'string' ? formatBucketLabel(value, locale) : ''
            }
            formatter={(value) => valueFormat(Number(value))}
          />
          {showLegend && (
            <Legend
              iconType={'plainline'}
              wrapperStyle={{ color: 'var(--ink-secondary)', fontSize: 12 }}
            />
          )}
          {compareKey && (
            <Line
              type={'monotone'}
              dataKey={compareKey}
              name={compareLabel}
              stroke={'var(--chart-compare)'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={!reduceMotion}
            />
          )}
          {series.map((spec, index) => (
            <Line
              key={spec.key}
              type={'monotone'}
              dataKey={spec.key}
              name={spec.label}
              stroke={`var(--chart-${(index % 8) + 1})`}
              strokeWidth={2}
              strokeLinecap={'round'}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
              isAnimationActive={!reduceMotion}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
