import type { Metadata } from 'next'
import '../../globals.css'
import { ReactNode } from 'react'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import { PerformanceTracker } from '@/app/components/performance-tracker'
import localFont from 'next/font/local'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
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

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ lang: 'en' | 'ko' }>
}>) {
  return (
    <html
      lang={(await params).lang}
      className={`text-gdg-black bg-neutral-50 ${googleSans.className}`}
    >
      <body>
        <Header />
        {children}
        <Footer />
      </body>
      <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
      <PerformanceTracker />
    </html>
  )
}
