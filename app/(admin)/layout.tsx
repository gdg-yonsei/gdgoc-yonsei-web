/** 공개 사이트와 루트 레이아웃을 분리해 CSS·폰트·메타데이터를 격리한다.
 * 공통 부모가 없으므로 `rootMetadata`를 여기서도 펼치고 관리자 색인을 막는다. */
import '../admin.css'
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

export const viewport: Viewport = rootViewport

/** 한글은 Pretendard가 이어받으며, 폰트 순서는 공용 `globals.css`의 `--font-sans`가 정한다. */
const googleSans = localFont({
  src: '../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-google-sans',
  weight: '100 900',
})

/** 공유 셸에서 `cookies()`/`headers()`를 읽으면 로그인 페이지까지 요청을 기다려야 한다.
 * 정적 셸을 유지하도록 언어·테마는 `admin/layout.tsx`에서 적용한다. */
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
