import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../../globals.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import localFont from 'next/font/local'
import languageParamChecker from '@/lib/language-param-checker'

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

// Google Product Sans 폰트
const googleSans = localFont({
  src: '../../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

export default async function RootLayout({
  children,
  params,
}: LangLayoutProps) {
  // 언어 설정
  const lang = languageParamChecker((await params).lang)

  return (
    <html
      lang={lang}
      className={`text-gdg-black bg-neutral-50 ${googleSans.className}`}
      suppressHydrationWarning
    >
      <body>
        <Header lang={lang} />
        <main>{children}</main>
        <Footer lang={lang} />
        <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
      </body>
    </html>
  )
}
