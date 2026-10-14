'use client'

/** 지표 타일: 값, 직전 기간 대비 증감(화살표+부호+문구), 추이 스파크라인. 증감 색은 방향 × "올라가면 좋은 지표인지"로 정한다. */
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid'
import { formatSignedPercent } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${28 - ((value - min) / span) * 24}`
    )
    .join(' ')
  return (
    <svg
      viewBox={'0 0 100 30'}
      preserveAspectRatio={'none'}
      className={'h-8 w-full'}
      aria-hidden={'true'}
    >
      <polyline
        points={points}
        fill={'none'}
        stroke={'var(--chart-1)'}
        strokeWidth={2}
        vectorEffect={'non-scaling-stroke'}
      />
    </svg>
  )
}

export default function MetricTile({
  label,
  value,
  delta,
  goodWhenUp,
  spark,
}: {
  label: string
  value: string
  delta: number | null
  goodWhenUp: boolean
  spark: number[]
}) {
  const { t, locale } = useAdminI18n()
  const signed = formatSignedPercent(delta, locale)
  const tone =
    delta === null || delta === 0
      ? 'neutral'
      : delta > 0 === goodWhenUp
        ? 'good'
        : 'bad'
  const Icon =
    delta !== null && delta < 0 ? ArrowDownRightIcon : ArrowUpRightIcon

  return (
    <div
      className={
        'border-hairline bg-surface flex min-w-0 flex-col gap-2 rounded-lg border p-4'
      }
    >
      <span className={'type-caption text-ink-muted'}>{label}</span>
      <span className={'type-heading-1 text-ink'}>{value}</span>
      {signed && (
        <span className={'type-caption flex flex-wrap items-center gap-1'}>
          <span
            data-tone={tone}
            className={
              tone === 'good'
                ? 'text-success'
                : tone === 'bad'
                  ? 'text-danger'
                  : 'text-ink-muted'
            }
          >
            <Icon className={'mr-0.5 inline size-4'} aria-hidden={'true'} />
            {signed}
          </span>
          <span className={'text-ink-muted'}>{t('analyticsVsPrevious')}</span>
        </span>
      )}
      <Sparkline values={spark} />
    </div>
  )
}
