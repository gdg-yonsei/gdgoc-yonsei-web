/**
 * 관리자 영역(GYMS)과 로그인 화면의 루트 레이아웃(`<html>` 문서 셸).
 *
 * 공개 사이트(`app/(home)/[lang]`)와 루트 레이아웃을 따로 두어 CSS·폰트·메타데이터를 분리한다. 두 루트
 * 레이아웃 위에 공통 레이아웃이 없으므로 공통 메타데이터(`rootMetadata`)를 여기서도 펼친다.
 * 관리자 화면은 검색에 노출되지 않도록 robots를 모두 막는다.
 */
import '../globals.css'
import { ReactNode } from 'react'
import localFont from 'next/font/local'
import type { Metadata, Viewport } from 'next'
import { cn } from '@/lib/cn'
import { rootMetadata, rootViewport } from '@/lib/seo/metadata'

/** 관리자 영역 전체를 검색 색인·캐시·미리보기에서 제외한다. */
export const metadata: Metadata = {
  ...rootMetadata(),
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

/** 모바일 뷰포트 설정. */
export const viewport: Viewport = rootViewport

/**
 * 라틴 글자용 폰트. 한글은 `app/pretendard.css`의 'Pretendard Variable'이 이어받고,
 * 폰트 순서는 `app/globals.css`(공용 기반)의 `--font-sans`에 정의되어 있다.
 */
const googleSans = localFont({
  src: '../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-google-sans',
  weight: '100 900',
})

/**
 * 관리자 영역의 문서 셸.
 *
 * 로그인 페이지까지 포함하는 공유 셸이라 일부러 정적으로 둔다. 여기서
 * `cookies()`/`headers()`를 읽으면 cacheComponents 환경에서 로그인 페이지까지 요청을
 * 기다리는(blocking) 라우트가 되어 정적 렌더링이 깨진다. 언어·테마는 실제로 필요한
 * `admin/layout.tsx`에서 적용한다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={'en'}
      className={cn(
        googleSans.variable,
        'bg-canvas text-ink font-sans antialiased'
      )}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
