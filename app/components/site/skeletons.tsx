/** 허브 fallback과 loading.tsx는 같은 스켈레톤을 쓴다.
 * Tailwind가 찾을 수 있도록 크기 클래스는 호출부에서 문자열 그대로 넘긴다. */
import type { ReactNode } from 'react'

export function SkeletonBars({
  count,
  className,
}: {
  count: number
  className: string
}) {
  return Array.from({ length: count }, (_, index) => (
    <span key={index} className={`skeleton-bar ${className}`} />
  ))
}

export function ProjectCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="release-grid">
      <SkeletonBars count={count} className="aspect-[4/5] rounded-3xl" />
    </div>
  )
}

export function ArchiveListSkeleton({
  label,
  showFilters = true,
  children,
}: {
  label: string
  showFilters?: boolean
  children: ReactNode
}) {
  return (
    <div role="status" aria-label={label} className="archive-skeleton">
      {showFilters && (
        <>
          <span className="skeleton-bar h-10 w-72 max-w-full" />
          <span className="skeleton-bar h-36 w-full rounded-3xl" />
        </>
      )}
      {children}
    </div>
  )
}

export function GenerationPageSkeleton({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-label={label} className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}
