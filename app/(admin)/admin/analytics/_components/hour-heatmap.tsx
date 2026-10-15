'use client'

/**
 * 요일×시간 방문 강도(bklit ui Heatmap). bklit 기본 축·툴팁은 달력(월·영어 요일·날짜)용이라 축과 툴팁은 여기서 그린다.
 * bklit 셀 색은 절대 개수(1·2·3·4+) 단계라, 최댓값 대비 단계(0~4)를 개수 자리에 넣고 실제 값은 툴팁에서 찾는다.
 * 0은 바탕색, 1~4는 한 색상 순차 단계(--chart-seq-2..5)다.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChartMotion,
  TOOLTIP_PANEL_STYLE,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import {
  buildHeatmapColorScale,
  HeatmapCells,
  HeatmapChart,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  useHeatmap,
  useHeatmapInteraction,
  type HeatmapColumn,
  type HeatmapLevelColors,
} from '@/app/components/admin/charts/heatmap'
import { TooltipBox } from '@/app/components/admin/charts/tooltip'

const LEVEL_COLORS: HeatmapLevelColors = [
  'var(--surface-sunken)',
  'var(--chart-seq-2)',
  'var(--chart-seq-3)',
  'var(--chart-seq-4)',
  'var(--chart-seq-5)',
]
const LEGEND_SCALE = buildHeatmapColorScale(LEVEL_COLORS)

/** 툴팁이 칸 위치를 되찾도록 열(시간)·행(요일)을 날짜 칸에 담는다. 실제 날짜 뜻은 없다. */
function cellDate(column: number, row: number) {
  return new Date(Date.UTC(2000, 0, 1 + row, column))
}

function level(value: number, max: number) {
  if (max <= 0 || value <= 0) return 0
  return Math.min(4, Math.ceil((value / max) * 4))
}

/** bklit 축처럼 차트 컨테이너에 겹쳐 그린다. 컨테이너 ref는 마운트 뒤에만 있다. */
function useContainer() {
  const { containerRef } = useHeatmap()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  useEffect(() => setContainer(containerRef.current), [containerRef])
  return container
}

function HourAxis({ labels }: { labels: string[] }) {
  const { margin, xScale, binWidth, gap } = useHeatmap()
  const container = useContainer()
  if (!container) return null
  return createPortal(
    labels.map((label, column) =>
      // 24칸 모두 쓰면 겹쳐서 3시간마다 적는다.
      column % 3 === 0 ? (
        <span
          key={label}
          aria-hidden={'true'}
          className={
            'type-caption text-ink-muted pointer-events-none absolute top-1 -translate-x-1/2 tabular-nums'
          }
          style={{ left: margin.left + xScale(column) + (binWidth - gap) / 2 }}
        >
          {label}
        </span>
      ) : null
    ),
    container
  )
}

function WeekdayAxis({ labels }: { labels: string[] }) {
  const { margin, yScale, binHeight, gap } = useHeatmap()
  const container = useContainer()
  if (!container) return null
  return createPortal(
    labels.map((label, row) => (
      <span
        key={label}
        aria-hidden={'true'}
        className={
          'type-caption text-ink-muted pointer-events-none absolute left-0 -translate-y-1/2 text-right'
        }
        style={{
          top: margin.top + yScale(row) + (binHeight - gap) / 2,
          width: margin.left - 8,
        }}
      >
        {label}
      </span>
    )),
    container
  )
}

function CellTooltip({
  rows,
  columns,
  values,
  format,
}: {
  rows: string[]
  columns: string[]
  values: number[][]
  format: (value: number) => string
}) {
  const { containerRef, width, height } = useHeatmap()
  const { tooltipData } = useHeatmapInteraction()
  if (!tooltipData) return null
  const column = tooltipData.date.getUTCHours()
  const row = tooltipData.date.getUTCDate() - 1
  return (
    <TooltipBox
      animate={false}
      containerHeight={height}
      containerRef={containerRef}
      containerWidth={width}
      panelStyle={TOOLTIP_PANEL_STYLE}
      visible
      x={tooltipData.x}
      y={tooltipData.y}
    >
      <div className={'px-3 py-2'}>
        <p className={'type-caption text-ink-muted'}>
          {`${rows[row] ?? ''} ${columns[column] ?? ''}`}
        </p>
        <p className={'type-body-sm text-ink font-medium tabular-nums'}>
          {format(values[row]?.[column] ?? 0)}
        </p>
      </div>
    </TooltipBox>
  )
}

export default function HourHeatmap({
  rows,
  columns,
  values,
  format,
  lessLabel,
  moreLabel,
}: {
  rows: string[]
  columns: string[]
  values: number[][]
  format: (value: number) => string
  lessLabel: string
  moreLabel: string
}) {
  const max = Math.max(0, ...values.flat())
  const data: HeatmapColumn[] = columns.map((_, column) => ({
    bin: column,
    bins: rows.map((_, row) => ({
      bin: row,
      count: level(values[row]?.[column] ?? 0, max),
      date: cellDate(column, row),
    })),
  }))

  return (
    <ChartMotion>
      <HeatmapInteractionProvider>
        <HeatmapInteractionBoundary>
          <div className={'flex w-full flex-col gap-3'}>
            {/* 24칸이 좁은 화면에서 라벨보다 작아지지 않도록 최소 폭을 두고 카드 안에서 가로로 스크롤한다. */}
            <div className={'overflow-x-auto'}>
              <HeatmapChart
                className={'w-full min-w-[34rem]'}
                data={data}
                layout={'fluid'}
                gap={3}
                levelColors={LEVEL_COLORS}
                margin={{ top: 24, right: 0, bottom: 0, left: 40 }}
              >
                <HeatmapCells />
                <HourAxis labels={columns} />
                <WeekdayAxis labels={rows} />
                <CellTooltip
                  rows={rows}
                  columns={columns}
                  values={values}
                  format={format}
                />
              </HeatmapChart>
            </div>
            <HeatmapLegend
              align={'end'}
              lessLabel={lessLabel}
              moreLabel={moreLabel}
              interactive={false}
              colorScale={LEGEND_SCALE}
            />
          </div>
        </HeatmapInteractionBoundary>
      </HeatmapInteractionProvider>
    </ChartMotion>
  )
}
