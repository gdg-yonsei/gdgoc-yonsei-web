/**
 * 최상위 레이아웃. 공통 메타데이터만 정하고 `<html>`은 그리지 않는다.
 *
 * 공개 사이트(`app/(home)/[lang]/layout.tsx`)와 관리자(`app/(admin)/layout.tsx`)가 각자
 * `<html>`·`<body>`를 그린다. 그래야 공개 사이트는 URL 언어를 `<html lang>`에 넣을 수 있다.
 */
import { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { getSiteEnv } from '@/lib/server/env'

const siteEnv = getSiteEnv()

/** 모든 페이지에 공통인 메타데이터(상대 URL의 기준 주소 등). */
export const metadata: Metadata = {
  metadataBase: new URL(siteEnv.NEXT_PUBLIC_SITE_URL),
  applicationName: 'GDGoC Yonsei',
  creator: 'GDGoC Yonsei',
  publisher: 'GDGoC Yonsei',
  category: 'technology',
  referrer: 'origin-when-cross-origin',
}

/** 모바일 뷰포트 설정. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/** 자식 레이아웃을 그대로 렌더링한다. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
