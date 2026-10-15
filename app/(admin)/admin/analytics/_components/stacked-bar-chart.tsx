'use client'

/**
 * 구간별 누적 막대(bklit ui). 합계와 구성(신규/재방문, 채널별)을 한 막대에서 함께 읽게 한다.
 * 시리즈 색은 넘긴 순서대로 --chart-1..8을 고정 배정한다. 9번째부터는 호출부가 "기타"로 묶는다.
 */
import { useParentSize } from '@visx/responsive'
import {
  ChartLegend,
  ChartMotion,
  TOOLTIP_PANEL_STYLE,
  seriesColor,
  useChartAnimationMs,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import type { SeriesSpec } from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import { formatBucketLabel } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { Bar } from '@/app/components/admin/charts/bar'
import { BarChart } from '@/app/components/admin/charts/bar-chart'
import { BarXAxis } from '@/app/components/admin/charts/bar-x-axis'
import { Grid } from '@/app/components/admin/charts/grid'
import { ChartTooltip } from '@/app/components/admin/charts/tooltip'
import { YAxis } from '@/app/components/admin/charts/y-axis'

export default function StackedBarChart({
  data,
  series,
  xKey,
  valueFormat,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  series: SeriesSpec[]
  xKey: string
  valueFormat: (value: number) => string
  height?: number
}) {
  const { locale } = useAdminI18n()
  const animationMs = useChartAnimationMs(700)
  // 날짜 라벨 하나에 약 72px가 필요하다. 좁은 화면에서 겹치지 않도록 폭에 맞춰 줄인다.
  const { parentRef, width } = useParentSize({ debounceTime: 50 })
  const maxLabels = Math.max(2, Math.floor((width - 72) / 72))
  const chartData = data.map((row) => ({
    ...row,
    label: formatBucketLabel(String(row[xKey]), locale),
  }))
  const items = series.map((spec, index) => ({
    ...spec,
    color: seriesColor(index),
  }))

  return (
    <div className={'flex flex-col gap-2'}>
      {items.length > 1 && <ChartLegend items={items} />}
      <ChartMotion>
        <div ref={parentRef} style={{ height }}>
          <BarChart
            data={chartData}
            xDataKey={'label'}
            stacked
            stackGap={2}
            barGap={0.25}
            aspectRatio={''}
            className={'h-full'}
            // 아래 여백이 좁으면 y축 0 라벨과 첫 날짜 라벨이 겹친다.
            margin={{ top: 8, right: 16, bottom: 36, left: 56 }}
            animationDuration={animationMs}
          >
            <Grid horizontal />
            {items.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                lineCap={2}
                stackGap={2}
                animate={animationMs > 0}
              />
            ))}
            <BarXAxis maxLabels={maxLabels} />
            <YAxis formatValue={valueFormat} />
            <ChartTooltip
              panelStyle={TOOLTIP_PANEL_STYLE}
              rows={(point) =>
                items.map((item) => ({
                  color: item.color,
                  label: item.label,
                  value: valueFormat(Number(point[item.key] ?? 0)),
                }))
              }
            />
          </BarChart>
        </div>
      </ChartMotion>
    </div>
  )
}
