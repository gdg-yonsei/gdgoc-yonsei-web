/**
 * 공개 사이트의 루트 레이아웃(`<html lang>` 문서 셸): 헤더, 본문, 푸터, Google Analytics.
 *
 * 언어는 URL의 `[lang]` 세그먼트로 정해지며, 두 언어 모두 빌드 시 미리 렌더링한다. 이 파일이 루트
 * 레이아웃이라 `lang`은 루트 매개변수(`next/root-params`)이고, 하위 서버 컴포넌트는 `params`를 넘겨받지
 * 않고 `getLocale()`(`lib/i18n/server.ts`)로 읽는다. 관리자 영역(`app/(admin)/layout.tsx`)은 별도의 루트
 * 레이아웃이라 CSS·스크립트가 섞이지 않고, 두 영역 사이 이동은 문서 전체를 다시 불러온다.
 */
import type { Metadata, Viewport } from 'next'
import '../../site.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { chromeCopy, siteMetadataCopy } from '@/lib/contents/site-copy'
import { cn } from '@/lib/cn'
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { rootMetadata, rootViewport } from '@/lib/seo/metadata'

/** Google Analytics 4 측정 ID(공개 사이트 전용, 관리자 화면에는 넣지 않는다). */
const GA_MEASUREMENT_ID = 'G-D77HTXJVT8'

/** 빌드 시 미리 렌더링할 경로 매개변수. */
export function generateStaticParams() {
  return localeStaticParams()
}

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata(): Promise<Metadata> {
  const copy = siteMetadataCopy[await getLocale()]

  return {
    ...rootMetadata(),
    title: {
      default: copy.defaultTitle,
      template: '%s | GDGoC Yonsei',
    },
    description: copy.defaultDescription,
  }
}

/** 브라우저 UI 색(모바일 주소창 등). */
export const viewport: Viewport = {
  ...rootViewport,
  // 헤더 캡슐과 히어로 무대는 어떤 색 모드에서도 GDG 검정이다.
  themeColor: '#1e1e1e',
}

/** 문서 셸. 본문 바로가기 링크, 헤더, `<main>`, 푸터를 그린다. */
export default async function LocaleLayout({
  children,
}: LayoutProps<'/[lang]'>) {
  const lang = await getLocale()

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
