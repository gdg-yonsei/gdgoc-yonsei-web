/** 상위 N개 항목을 가로 막대와 숫자로 보여 준다. 값이 글자로 늘 보여 툴팁 없이도 읽힌다. 막대는 한 색(슬롯 1)이다. */
import Link from 'next/link'

export type BarListItem = {
  label: string
  value: number
  href?: string
  secondary?: string
}

export default function BarList({
  items,
  valueLabel,
  format,
}: {
  items: BarListItem[]
  valueLabel: string
  format: (value: number) => string
}) {
  const max = Math.max(0, ...items.map((item) => item.value))
  return (
    <ul className={'flex flex-col gap-1'} aria-label={valueLabel}>
      {items.map((item) => {
        const width = max > 0 ? `${(item.value / max) * 100}%` : '0%'
        const label = (
          <span className={'text-ink truncate'} title={item.label}>
            {item.label}
          </span>
        )
        return (
          <li
            key={item.label}
            className={
              'relative flex min-h-11 items-center gap-3 rounded-sm px-2'
            }
          >
            <span
              data-bar
              aria-hidden={'true'}
              className={
                'absolute inset-y-1.5 left-0 rounded-r-[4px] opacity-15'
              }
              style={{ width, background: 'var(--chart-1)' }}
            />
            <span
              className={'type-body-sm relative flex min-w-0 flex-1 flex-col'}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className={'hover:underline focus-visible:underline'}
                >
                  {label}
                </Link>
              ) : (
                label
              )}
              {item.secondary && (
                <span className={'type-caption text-ink-muted truncate'}>
                  {item.secondary}
                </span>
              )}
            </span>
            <span className={'type-body-sm text-ink relative tabular-nums'}>
              {format(item.value)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
