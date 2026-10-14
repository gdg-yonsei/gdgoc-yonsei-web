/** Web Vitals 등급 분포 막대. 상태 색과 함께 아이콘·라벨·비율을 글자로 보여 색만으로 뜻을 전하지 않는다. */
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'

export default function RatingBar({
  good,
  needsImprovement,
  poor,
  labels,
}: {
  good: number
  needsImprovement: number
  poor: number
  labels: { good: string; needsImprovement: string; poor: string }
}) {
  const total = good + needsImprovement + poor
  const parts = [
    {
      key: 'good',
      value: good,
      label: labels.good,
      color: 'var(--status-good)',
      Icon: CheckCircleIcon,
    },
    {
      key: 'ni',
      value: needsImprovement,
      label: labels.needsImprovement,
      color: 'var(--status-warning)',
      Icon: ExclamationTriangleIcon,
    },
    {
      key: 'poor',
      value: poor,
      label: labels.poor,
      color: 'var(--status-critical)',
      Icon: XCircleIcon,
    },
  ]
  const share = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className={'flex flex-col gap-2'}>
      <div
        className={'flex h-3 w-full gap-0.5 overflow-hidden rounded-[4px]'}
        aria-hidden={'true'}
      >
        {parts.map((part) =>
          part.value > 0 ? (
            <span
              key={part.key}
              style={{ width: `${share(part.value)}%`, background: part.color }}
            />
          ) : null
        )}
      </div>
      <ul
        className={
          'type-caption text-ink-secondary flex flex-wrap gap-x-3 gap-y-1'
        }
      >
        {parts.map((part) => (
          <li key={part.key} className={'flex items-center gap-1'}>
            <part.Icon
              className={'size-4'}
              style={{ color: part.color }}
              aria-hidden={'true'}
            />
            <span>{`${part.label} ${share(part.value)}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
