import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import localFont from 'next/font/local'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
}

const googleSans = localFont({
  src: './fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" className={`bg-neutral-50 ${googleSans.className}`}>
      <body>{children}</body>
      <GoogleAnalytics gaId={'G-D77HTXJVT8'} />
    </html>
  )
}
