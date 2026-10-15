'use client'

/**
 * 이전 페이지 → 이 페이지 → 다음 페이지 흐름(bklit ui Sankey). 양쪽은 상위 몇 개만 그리고 나머지는 표 보기에 둔다.
 * 노드 이름 옆 값 라벨은 bklit 기본 문구가 영어("sessions")라 끄고, 툴팁에서 관리자 언어로 보여 준다.
 */
import {
  ChartMotion,
  useChartAnimationMs,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
} from '@/app/components/admin/charts/sankey'
import { TooltipContent } from '@/app/components/admin/charts/tooltip'

const MAX_PER_SIDE = 5

export type FlowRow = { label: string; value: number }

export default function PageFlowSankey({
  page,
  previous,
  next,
  valueLabel,
  format,
}: {
  page: string
  previous: FlowRow[]
  next: FlowRow[]
  valueLabel: string
  format: (value: number) => string
}) {
  const animationMs = useChartAnimationMs(900)
  const before = previous.filter((row) => row.value > 0).slice(0, MAX_PER_SIDE)
  const after = next.filter((row) => row.value > 0).slice(0, MAX_PER_SIDE)
  // 같은 경로가 양쪽에 있어도 노드가 따로 서야 순환이 생기지 않는다.
  const nodes = [
    ...before.map((row) => ({ name: row.label })),
    { name: page },
    ...after.map((row) => ({ name: row.label })),
  ]
  const center = before.length
  const links = [
    ...before.map((row, index) => ({
      source: index,
      target: center,
      value: row.value,
    })),
    ...after.map((row, index) => ({
      source: center,
      target: center + 1 + index,
      value: row.value,
    })),
  ]
  const color = (index: number) =>
    index === center ? 'var(--chart-1)' : 'var(--chart-compare)'

  return (
    <ChartMotion>
      <SankeyChart
        data={{ nodes, links }}
        // 전체 폭에서 2:1이면 너무 길어 높이를 고정한다.
        aspectRatio={''}
        className={'h-72 sm:h-80'}
        nodeWidth={12}
        nodePadding={16}
        margin={{ top: 8, right: 120, bottom: 8, left: 120 }}
        animationDuration={animationMs}
      >
        <SankeyLink getNodeColor={(_, index) => color(index)} />
        <SankeyNode
          getNodeColor={(_, index) => color(index)}
          showValueLabels={false}
        />
        <SankeyTooltip
          nodeContent={({ node }) => (
            <TooltipContent
              title={node.name}
              rows={[
                {
                  color: 'var(--chart-1)',
                  label: valueLabel,
                  value: format(node.value ?? 0),
                },
              ]}
            />
          )}
          linkContent={({ link, index }) => (
            <TooltipContent
              title={`${nodes[links[index]?.source ?? 0]?.name ?? ''} → ${nodes[links[index]?.target ?? 0]?.name ?? ''}`}
              rows={[
                {
                  color: 'var(--chart-1)',
                  label: valueLabel,
                  value: format(link.value),
                },
              ]}
            />
          )}
        />
      </SankeyChart>
    </ChartMotion>
  )
}
