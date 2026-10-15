'use client'

/**
 * 몇 안 되는 범주의 비중(기기 등)을 도넛으로 보여 준다. 5개를 넘는 꼬리는 "기타"로 묶어 색이 8개를 넘지 않게 하고,
 * 옆 목록에 값과 비율을 글자로 적어 색만으로 뜻을 전하지 않는다. 가운데는 합계, 조각에 올리면 그 조각 값이다.
 */
import {
  ChartMotion,
  seriesColor,
} from '@/app/(admin)/admin/analytics/_components/chart-kit'
import { formatPercent } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { PieCenter } from '@/app/components/admin/charts/pie-center'
import { PieChart } from '@/app/components/admin/charts/pie-chart'
import { PieSlice } from '@/app/components/admin/charts/pie-slice'

const MAX_SLICES = 5

export type ShareItem = { label: string; value: number }

export default function ShareDonut({
  items,
  totalLabel,
  otherLabel,
  format,
}: {
  items: ShareItem[]
  totalLabel: string
  otherLabel: string
  format: (value: number) => string
}) {
  const { locale } = useAdminI18n()
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, MAX_SLICES - 1)
  const tail = sorted.slice(MAX_SLICES - 1)
  const slices = (
    tail.length > 1
      ? [
          ...head,
          {
            label: otherLabel,
            value: tail.reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : sorted
  ).map((item, index) => ({ ...item, color: seriesColor(index) }))
  const total = slices.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={'flex flex-wrap items-center gap-4'}>
      <div className={'size-40 shrink-0'} aria-hidden={'true'}>
        <ChartMotion>
          <PieChart
            data={slices}
            innerRadius={52}
            padAngle={0.02}
            cornerRadius={4}
            hoverOffset={4}
          >
            {slices.map((slice, index) => (
              <PieSlice
                key={slice.label}
                index={index}
                showGlow={false}
                hoverEffect={'grow'}
              />
            ))}
            <PieCenter defaultLabel={totalLabel} />
          </PieChart>
        </ChartMotion>
      </div>
      {/* 목록 폭이 모자라면 도넛 아래로 내려가 라벨이 잘리지 않는다. */}
      <ul className={'flex min-w-48 flex-1 flex-col gap-1.5'}>
        {slices.map((slice) => (
          <li
            key={slice.label}
            className={'type-body-sm flex items-center gap-2'}
          >
            <span
              aria-hidden={'true'}
              className={'size-2.5 shrink-0 rounded-full'}
              style={{ background: slice.color }}
            />
            <span className={'text-ink min-w-0 flex-1 truncate'}>
              {slice.label}
            </span>
            <span className={'text-ink tabular-nums'}>
              {format(slice.value)}
            </span>
            <span className={'text-ink-muted w-14 text-right tabular-nums'}>
              {formatPercent(total > 0 ? slice.value / total : 0, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
