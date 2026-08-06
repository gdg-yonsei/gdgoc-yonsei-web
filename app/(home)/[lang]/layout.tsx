import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../../globals.css'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import LazyMotionProvider from '@/app/components/motion/lazy-motion-provider'
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

// 라틴 본문 서체: Google Sans. 한글은 globals.css가 @import 하는 Pretendard
// 서브셋(`--font-sans` 스택의 다음 패밀리)이 이어받습니다.
const googleSans = localFont({
  src: '../../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-google-sans',
  weight: '100 900',
})

// 데이터·라벨 서체: JetBrains Mono Variable (self-hosted)
const jetbrainsMono = localFont({
  src: '../../fonts/jetbrains-mono-variable.woff2',
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
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
      className={`bg-canvas text-ink font-sans ${googleSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <LazyMotionProvider>
          <Header lang={lang} />
          <main>{children}</main>
          <Footer lang={lang} />
        </LazyMotionProvider>
        <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
      </body>
    </html>
  )
}
