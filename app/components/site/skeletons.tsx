/**
 * 공개 사이트 로딩 스켈레톤 모음.
 *
 * 허브 페이지의 Suspense fallback과 기수 페이지의 `loading.tsx`가 같은 모양을 쓰도록
 * 한곳에 모았다. 막대 모양은 `site-content.css`의 `.skeleton-bar`가 그린다.
 * Tailwind가 클래스를 찾을 수 있도록 크기 클래스는 호출부에서 문자열 그대로 넘긴다.
 */
import type { ReactNode } from 'react'

/** 같은 모양의 스켈레톤 막대를 `count`개 그린다. */
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

/** 프로젝트 카드 격자 자리. */
export function ProjectCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="release-grid">
      <SkeletonBars count={count} className="aspect-[4/5] rounded-3xl" />
    </div>
  )
}

/** 허브 목록 영역 fallback. 기수 필터 띠와 필터 막대 아래에 목록 모양을 그린다. */
export function ArchiveListSkeleton({
  label,
  showFilters = true,
  children,
}: {
  /** 스크린리더용 상태 문구(예: "Loading sessions"). */
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

/** 기수 페이지 `loading.tsx` 공통 틀: 브레드크럼·제목·설명 자리 아래에 목록 모양. */
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
