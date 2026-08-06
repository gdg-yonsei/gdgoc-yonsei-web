import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 관리자 페이지 콘텐츠 컨테이너
 *
 * 사이드바/앱바/하단 탭 바에 대한 오프셋은 `app/(admin)/admin/layout.tsx`의
 * `<main>`이 소유합니다. 이 컴포넌트는 페이지 콘텐츠의 세로 리듬만 담당합니다.
 * @param children - 레이아웃에 포함될 컴포넌트
 * @param className - 추가 CSS 클래스
 * @constructor
 */
export default async function AdminDefaultLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {children}
    </div>
  )
}
