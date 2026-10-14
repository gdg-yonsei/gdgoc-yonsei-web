/** 보고서 표. 숫자 열은 오른쪽 정렬·고정폭 숫자, 첫 열은 행 머리다. 좁은 화면에서는 가로로 스크롤한다. */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type MetricColumn<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
  numeric?: boolean
}

export default function MetricTable<T>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  caption: string
  columns: Array<MetricColumn<T>>
  rows: T[]
  rowKey: (row: T) => string
}) {
  return (
    <div className={'overflow-x-auto'}>
      <table className={'type-body-sm w-full border-collapse'}>
        <caption className={'sr-only'}>{caption}</caption>
        <thead>
          <tr className={'border-hairline text-ink-muted border-b'}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope={'col'}
                className={cn(
                  'px-2 py-2 font-medium whitespace-nowrap',
                  column.numeric ? 'text-right' : 'text-left'
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={'border-hairline border-b last:border-b-0'}
            >
              {columns.map((column, index) => {
                const Cell = index === 0 ? 'th' : 'td'
                return (
                  <Cell
                    key={column.key}
                    scope={index === 0 ? 'row' : undefined}
                    className={cn(
                      'text-ink px-2 py-2.5',
                      column.numeric
                        ? 'text-right tabular-nums'
                        : 'max-w-80 truncate text-left font-normal'
                    )}
                  >
                    {column.render(row)}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
