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

export function generateStaticParams() {
  return localeStaticParams()
}

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

export const viewport: Viewport = {
  // The header capsule and hero stage are GDG black in every scheme.
  themeColor: '#1e1e1e',
}

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
