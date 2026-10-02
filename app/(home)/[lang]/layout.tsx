/**
 * 공개 사이트의 루트 레이아웃(`<html lang>` 문서 셸): 헤더, 본문, 푸터, Google Analytics.
 *
 * 언어는 URL의 `[lang]` 세그먼트로 정해지며, 두 언어 모두 빌드 시 미리 렌더링한다.
 * 관리자 영역(`app/(admin)`)과 루트 레이아웃을 분리해 CSS·스크립트가 섞이지 않는다.
 */
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '../../globals.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { chromeCopy, siteMetadataCopy } from '@/lib/contents/site-copy'
import { cn } from '@/lib/cn'
import { localeStaticParams, toLocale } from '@/lib/i18n'

/** Google Analytics 4 측정 ID(공개 사이트 전용, 관리자 화면에는 넣지 않는다). */
const GA_MEASUREMENT_ID = 'G-D77HTXJVT8'

type LangLayoutProps = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

/** 빌드 시 미리 렌더링할 경로 매개변수. */
export function generateStaticParams() {
  return localeStaticParams()
}

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata({
  params,
}: LangLayoutProps): Promise<Metadata> {
  const copy = siteMetadataCopy[toLocale((await params).lang)]

  return {
    title: {
      default: copy.defaultTitle,
      template: '%s | GDGoC Yonsei',
    },
    description: copy.defaultDescription,
  }
}

/** 브라우저 UI 색(모바일 주소창 등). */
export const viewport: Viewport = {
  // 헤더 캡슐과 히어로 무대는 어떤 색 모드에서도 GDG 검정이다.
  themeColor: '#1e1e1e',
}

/** 문서 셸. 본문 바로가기 링크, 헤더, `<main>`, 푸터를 그린다. */
export default async function LocaleLayout({
  children,
  params,
}: LangLayoutProps) {
  const lang = toLocale((await params).lang)

  return (
    <html
      lang={lang}
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
      data-color-scheme="auto"
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">
          {chromeCopy[lang].skipToContent}
        </a>
        <Header lang={lang} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer lang={lang} />
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      </body>
    </html>
  )
}
