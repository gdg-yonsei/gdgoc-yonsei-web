'use client'

/**
 * 시간 추이 선 차트(bklit ui). 시리즈 색은 넘긴 순서대로 --chart-1..8을 고정 배정하고, 비교 기간은 회색 실선이다.
 * 축은 하나만 쓴다. bands를 넘기면 좋음·개선 필요·나쁨 같은 기준 구간을 배경 띠로 깔고 범례에 이름을 적는다.
 */
import { curveMonotoneX } from '@visx/curve'
import {
  BucketDateFormat,
  ChartLegend,
  ChartMotion,
  TOOLTIP_PANEL_STYLE,
  bucketToDate,
  seriesColor,
  useChartAnimationMs,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import { Grid } from '@/app/components/admin/charts/grid'
import { LineChart, Line } from '@/app/components/admin/charts/line-chart'
import { ReferenceArea } from '@/app/components/admin/charts/reference-area'
import { ChartTooltip } from '@/app/components/admin/charts/tooltip'
import { XAxis } from '@/app/components/admin/charts/x-axis'
import { YAxis } from '@/app/components/admin/charts/y-axis'

export type SeriesSpec = { key: string; label: string }
export type ChartBand = {
  from: number
  to: number
  color: string
  label: string
}

export default function TimeSeriesChart({
  data,
  series,
  xKey,
  valueFormat,
  compareKey,
  compareLabel,
  bands,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  series: SeriesSpec[]
  xKey: string
  valueFormat: (value: number) => string
  compareKey?: string
  compareLabel?: string
  bands?: ChartBand[]
  height?: number
}) {
  const animationMs = useChartAnimationMs(900)
  const hourly = String(data[0]?.[xKey] ?? '').length === 13
  const chartData = data.map((row) => ({
    ...row,
    date: bucketToDate(String(row[xKey])),
  }))
  const lines = [
    ...(compareKey
      ? [
          {
            key: compareKey,
            label: compareLabel ?? compareKey,
            color: 'var(--chart-compare)',
          },
        ]
      : []),
    ...series.map((spec, index) => ({
      key: spec.key,
      label: spec.label,
      color: seriesColor(index),
    })),
  ]

  return (
    <div className={'flex flex-col gap-2'}>
      {(lines.length > 1 || bands) && (
        <ChartLegend
          items={[...(lines.length > 1 ? lines : []), ...(bands ?? [])]}
        />
      )}
      <ChartMotion>
        <BucketDateFormat hourly={hourly}>
          <LineChart
            data={chartData}
            aspectRatio={''}
            style={{ height }}
            // 아래 여백이 좁으면 y축 0 라벨과 첫 날짜 라벨이 겹친다.
            margin={{ top: 8, right: 16, bottom: 40, left: 56 }}
            animationDuration={animationMs}
          >
            {bands?.map((band) => (
              <ReferenceArea
                key={`${band.from}-${band.to}`}
                y1={band.from}
                y2={band.to}
                fill={band.color}
                fillOpacity={0.1}
              />
            ))}
            <Grid horizontal />
            {lines.map((line) => (
              <Line
                key={line.key}
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                curve={curveMonotoneX}
                // 양 끝을 흐리게 하면 첫날·마지막 날 값이 덜 보인다.
                fadeEdges={false}
                animate={animationMs > 0}
              />
            ))}
            <XAxis />
            <YAxis formatValue={valueFormat} />
            <ChartTooltip
              panelStyle={TOOLTIP_PANEL_STYLE}
              rows={(point) =>
                lines.map((line) => ({
                  color: line.color,
                  label: line.label,
                  value: valueFormat(Number(point[line.key] ?? 0)),
                }))
              }
            />
          </LineChart>
        </BucketDateFormat>
      </ChartMotion>
    </div>
  )
}
