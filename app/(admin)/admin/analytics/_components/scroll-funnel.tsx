'use client'

/**
 * 스크롤 깊이(25→50→75→100%) 이탈을 깔때기로 보여 준다(bklit ui Funnel). 단계 값은 조회 대비 도달 비율이다.
 * bklit 기본 비율 표시는 첫 단계 대비라 끄고, 도달 비율을 값으로 적는다.
 */
import {
  ChartMotion,
  useChartAnimationMs,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import { FunnelChart } from '@/app/components/admin/charts/funnel-chart'

export default function ScrollFunnel({
  steps,
  format,
}: {
  steps: Array<{ threshold: number; rate: number }>
  format: (value: number) => string
}) {
  const animate = useChartAnimationMs(1) > 0
  return (
    <ChartMotion>
      <FunnelChart
        data={steps.map((step) => ({
          label: `${step.threshold}%`,
          value: step.rate,
          displayValue: format(step.rate),
        }))}
        color={'var(--chart-1)'}
        showPercentage={false}
        staggerDelay={animate ? 0.12 : 0}
        style={{ aspectRatio: '2 / 1' }}
      />
    </ChartMotion>
  )
}
