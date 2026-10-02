/**
 * 관리자 화면의 Suspense 대체 UI(스켈레톤) 모음. 실제 표·카드 모양을 흉내 내 데이터 도착 시 레이아웃이 튀지 않게 한다.
 */
import { cn } from '@/lib/cn'

/**
 * 목록 표 로딩용 스켈레톤. 헤더 줄과 `rows`개의 행을 그린다.
 * @param rows 행 개수(기본 6)
 */
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={'admin-table'} aria-hidden={'true'}>
      <div className={'border-hairline bg-canvas h-10 border-b'} />
      <div className={'flex flex-col'}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-4 px-4 py-3.5',
              index > 0 && 'border-hairline border-t'
            )}
          >
            <div
              className={'bg-surface-sunken h-4 flex-1 animate-pulse rounded'}
            />
            <div
              className={
                'bg-surface-sunken hidden h-4 w-24 animate-pulse rounded lg:block'
              }
            />
            <div
              className={
                'bg-surface-sunken hidden h-4 w-20 animate-pulse rounded lg:block'
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 대시보드 카드 로딩용 스켈레톤. */
export function AdminCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden={'true'}
      className={cn(
        'border-hairline bg-surface-sunken h-28 w-full animate-pulse rounded-lg border',
        className
      )}
    />
  )
}
