/**
 * 관리자 페이지 본문 컨테이너. 각 관리자 page가 최상위 래퍼로 쓴다(서버 컴포넌트).
 */
import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 페이지 콘텐츠의 세로 간격만 맡는 컨테이너.
 *
 * 사이드바·앱바·하단 탭 바만큼의 여백은 `app/(admin)/admin/layout.tsx`의 `<main>`이
 * 이미 처리하므로 여기서는 다루지 않는다.
 * @param children 페이지 본문
 * @param className 추가 CSS 클래스
 */
export default function AdminDefaultLayout({
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
