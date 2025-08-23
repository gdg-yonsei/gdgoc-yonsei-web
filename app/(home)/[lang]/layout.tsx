import type { Metadata } from 'next'
import '../../globals.css'
import type LayoutProps from 'next' // 👈 추가
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import localFont from 'next/font/local'

export const metadata: Metadata = {
  title: {
    default: 'GDGoC Yonsei',
    template: '%s | GDGoC Yonsei',
  },
  description: 'Google Developer Group on Campus Yonsei University',
}

const googleSans = localFont({
  src: '../../fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default async function RootLayout({
  children,
  params,
  modal,
}: LayoutProps<'/[lang]'>) {
  return (
    <html
      lang={(await params).lang}
      className={`text-gdg-black bg-neutral-50 ${googleSans.className}`}
    >
      <body>
        <Header lang={(await params).lang} />
        {modal}
        {children}
        <Footer />
      </body>
      <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
    </html>
  )
}
