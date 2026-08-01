import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AdminColumn<T> = {
  /** 안정적인 열 식별자. React key와 `data-label`에 사용됩니다. */
  key: string
  header: string
  /** `grid-template-columns` 조각. 예: `'minmax(0,2fr)'`, `'8rem'` */
  width: string
  render: (item: T) => ReactNode
  /** 모바일에서 카드 제목으로 승격되는 열(행마다 하나). */
  primary?: boolean
  /** 모바일 카드에서 감춥니다(공간 절약). */
  hideOnMobile?: boolean
  className?: string
}

/**
 * 관리자 목록의 반응형 표.
 *
 * 하나의 DOM으로 두 레이아웃을 모두 처리합니다.
 * - lg 이상: `grid-template-columns`로 조밀한 표 행 (DESIGN.md `ex-data-table-cell`)
 * - lg 미만: 각 셀 앞에 열 이름을 붙인 카드로 리플로우
 *
 * DOM을 복제하지 않으므로 스크린리더가 같은 내용을 두 번 읽지 않고,
 * 테스트에서도 `getByText(exact)`가 중복 매치로 실패하지 않습니다.
 *
 * 행 전체가 하나의 `<a>`라 링크 중첩 없이 어디를 눌러도 상세로 이동합니다.
 */
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
  /**
   * 행 링크의 접근 가능한 이름을 명시적으로 지정합니다.
   * 생략하면 셀 텍스트를 이어붙인 값이 이름이 됩니다.
   */
  getAriaLabel?: (item: T) => string
  empty?: ReactNode
  /** 스크린리더용 목록 설명. 시각적으로는 표시되지 않습니다. */
  caption?: string
}) {
  if (items.length === 0) return <>{empty}</>

  const template = columns.map((column) => column.width).join(' ')

  return (
    <div
      className={'admin-table'}
      style={{ '--admin-table-cols': template } as React.CSSProperties}
    >
      {/* 열 제목 행. 모바일에서는 CSS로 숨겨지고(따라서 AT도 건너뜁니다),
          대신 각 셀이 `data-label`의 `::before`로 자기 열 이름을 직접 표시합니다. */}
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
