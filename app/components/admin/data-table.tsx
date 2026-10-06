import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AdminColumn<T> = {
  key: string
  header: string
  /** `grid-template-columns` 조각. 예: `'minmax(0,2fr)'`, `'8rem'` */
  width: string
  render: (item: T) => ReactNode
  /** 모바일에서 카드 제목으로 승격되는 열(행마다 하나). */
  primary?: boolean

  hideOnMobile?: boolean
  className?: string
}

/** 하나의 DOM이 lg 이상에서는 표, 아래에서는 카드가 되어 보조기술이 내용을 중복해서 읽지 않는다.
 * 행 전체가 a라 어디서 눌러도 이동하며 링크가 중첩되지 않는다. */
export default function AdminDataTable<T>({
  items,
  columns,
  getHref,
  getKey,
  getAriaLabel,
  empty,
  caption,
}: {
  items: T[]
  columns: AdminColumn<T>[]
  getHref: (item: T) => string
  getKey: (item: T) => string
  /** rowLabel이 없으면 셀 텍스트를 이어 붙여 행 링크의 접근 가능한 이름을 만든다. */
  getAriaLabel?: (item: T) => string
  empty?: ReactNode

  caption?: string
}) {
  if (items.length === 0) return <>{empty}</>

  const template = columns.map((column) => column.width).join(' ')

  return (
    <div
      className={'admin-table'}
      style={{ '--admin-table-cols': template } as React.CSSProperties}
    >
      {/* 모바일에서는 열 제목을 숨기고, 각 셀의 data-label을 ::before로 표시한다. */}
      <div className={'admin-table-head'}>
        {columns.map((column) => (
          <div key={column.key}>{column.header}</div>
        ))}
      </div>
      <ul className={'admin-table-body'} aria-label={caption}>
        {items.map((item) => (
          <li key={getKey(item)}>
            <Link
              href={getHref(item)}
              aria-label={getAriaLabel?.(item)}
              className={'admin-table-row'}
            >
              {columns.map((column) => (
                <span
                  key={column.key}
                  data-label={column.primary ? undefined : column.header}
                  className={cn(
                    'admin-table-cell',
                    column.primary && 'admin-table-cell-primary',
                    column.hideOnMobile && 'admin-table-cell-hide-mobile',
                    column.className
                  )}
                >
                  {column.render(item)}
                </span>
              ))}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
