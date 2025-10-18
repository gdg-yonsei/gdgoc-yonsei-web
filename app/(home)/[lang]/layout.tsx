import type { Metadata } from 'next'
import '../../globals.css'
import type LayoutProps from 'next'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import localFont from 'next/font/local'
import languageParamChecker from '@/lib/language-param-checker'

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const lang = (await params).lang

  if (lang === 'ko') {
    return {
      title: {
        default: 'GDGoC Yonsei',
        template: '%s | GDGoC Yonsei',
      },
      description: 'Google Developer Group on Campus 연세대학교',
    }
  }

  return {
    title: {
      default: 'GDGoC Yonsei',
      template: '%s | GDGoC Yonsei',
    },
    description: 'Google Developer Group on Campus Yonsei University',
  }
}

// Google Product Sans 폰트
const googleSans = localFont({
  src: '../../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

// SSG를 위해 params 값 지정
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  // 언어 설정
  const lang = languageParamChecker((await params).lang)

  return (
    <html
      lang={lang}
      className={`text-gdg-black bg-neutral-50 ${googleSans.className}`}
    >
      <body>
        <Header lang={lang} />
        {children}
        <Footer />
      </body>
      <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
    </html>
  )
}
