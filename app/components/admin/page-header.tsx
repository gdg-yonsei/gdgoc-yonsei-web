/**
 * 관리자 페이지 상단 헤더(제목, 설명, 뒤로 가기, 액션 버튼). 목록·상세·편집 화면이 함께 쓴다.
 */
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 관리자 페이지 상단 헤더.
 *
 * 모바일에서는 액션이 제목 아래로 내려가 전체 폭을 쓰고, 데스크톱에서는 같은 줄
 * 오른쪽에 붙는다.
 * @param backHref/backLabel 있으면 제목 위에 "뒤로" 링크를 보여 준다
 * @param actions 오른쪽 버튼 영역(생성·수정 버튼 등)
 */
export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
  meta,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  /** 제목 옆에 붙는 배지 등 */
  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {backHref && (
        <Link
          href={backHref}
          className={
            'text-ink-muted hover:text-ink type-body-sm focus-visible:outline-primary -ml-1 inline-flex w-fit items-center gap-1 rounded-sm py-1 pr-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
          }
        >
          <ChevronLeftIcon className={'size-4'} aria-hidden={'true'} />
          {backLabel}
        </Link>
      )}
      <div
        className={
          'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
        }
      >
        <div className={'flex min-w-0 flex-col gap-1'}>
          <div className={'flex flex-wrap items-center gap-2'}>
            <h1 className={'admin-title min-w-0'}>{title}</h1>
            {meta}
          </div>
          {description && (
            <p className={'type-body-sm text-ink-muted'}>{description}</p>
          )}
        </div>
        {actions && (
          <div className={'flex shrink-0 flex-wrap items-center gap-2'}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
