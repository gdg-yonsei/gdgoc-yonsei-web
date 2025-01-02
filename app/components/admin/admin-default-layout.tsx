import { ReactNode } from 'react'

/**
 * 관리자 페이지 기본 레이아웃
 *
 * 모바일에서 상단 바 사이즈 만큼 padding-top 추가
 * 데스크탑에서는 좌측 사이드바 사이즈 만큼 padding-left 추가
 * @param children - 레이아웃에 포함될 컴포넌트
 * @param className - 추가 CSS 클래스
 * @constructor
 */
export default function AdminDefaultLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full min-h-screen pt-20 lg:pt-4 lg:pl-64 ${className} p-4`}
    >
      {children}
    </div>
  )
}
