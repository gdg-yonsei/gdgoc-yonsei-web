/** `[lang]`은 루트 매개변수이며, 하위 서버 컴포넌트는 `getLocale()`로 읽는다.
 * 관리자 영역과 루트를 분리해 CSS·스크립트를 격리하며, 두 영역 간 이동은 문서 전체를 다시 불러온다. */
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

const GA_MEASUREMENT_ID = 'G-D77HTXJVT8'

export function generateStaticParams() {
  return localeStaticParams()
}

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

export const viewport: Viewport = {
  ...rootViewport,
  // 헤더 캡슐과 히어로 무대는 어떤 색 모드에서도 GDG 검정이다.
  themeColor: '#1e1e1e',
}

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
