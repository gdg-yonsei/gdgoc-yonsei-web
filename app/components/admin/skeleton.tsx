import { cn } from '@/lib/cn'

/**
 * 목록 로딩용 스켈레톤.
 *
 * 이전에는 모든 `<Suspense fallback>`이 `h-28`짜리 회색 막대 하나여서,
 * 데이터가 도착하는 순간 레이아웃이 크게 튀었습니다. 실제 표 모양을 흉내 내
 * 점프를 줄입니다.
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

export default AdminTableSkeleton
