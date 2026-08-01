import '../globals.css'
import { ReactNode } from 'react'
import localFont from 'next/font/local'
import type { Metadata } from 'next'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

/**
 * 라틴 글리프 담당. 한글은 `app/pretendard.css`의 'Pretendard Variable'이 이어받으며,
 * 폰트 스택 순서는 `app/globals.css`의 `--font-sans`에 정의되어 있습니다.
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
 * 이 레이아웃은 로그인 페이지까지 포함하는 공유 셸이므로 의도적으로 정적입니다.
 * 여기서 `cookies()`/`headers()`를 읽으면 cacheComponents가 켜진 상태에서
 * 로그인 페이지까지 blocking route가 되어 정적 렌더가 깨집니다.
 * 로케일·테마는 실제로 그것이 필요한 `admin/layout.tsx`에서 적용합니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
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
