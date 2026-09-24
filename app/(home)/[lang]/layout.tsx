import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '../../globals.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import languageParamChecker from '@/lib/language-param-checker'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { chromeCopy } from '@/lib/contents/site-copy'
import { cn } from '@/lib/cn'

type LangLayoutProps = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({
  params,
}: LangLayoutProps): Promise<Metadata> {
  const lang = languageParamChecker((await params).lang)

  if (lang === 'ko') {
    return {
      title: {
        default: 'GDGoC Yonsei | 연세대학교 학생 개발자 커뮤니티',
        template: '%s | GDGoC Yonsei',
      },
      description:
        '연세대학교 학생 개발자 커뮤니티 GDGoC Yonsei의 공식 웹사이트입니다. 기술 세션, 프로젝트, 구성원, 행사와 커뮤니티 활동을 확인하세요.',
    }
  }

  return {
    title: {
      default: 'GDGoC Yonsei | Yonsei University Developer Community',
      template: '%s | GDGoC Yonsei',
    },
    description:
      "Official website of GDGoC Yonsei, Yonsei University's student developer community. Explore technical sessions, projects, members, events, and activities.",
  }
}

export const viewport: Viewport = {
  // The header capsule and hero stage are GDG black in every scheme.
  themeColor: '#1e1e1e',
}

export default async function RootLayout({
  children,
  params,
}: LangLayoutProps) {
  const lang = languageParamChecker((await params).lang)

  return (
    <html
      lang={lang}
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
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
        <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
      </body>
    </html>
  )
}
