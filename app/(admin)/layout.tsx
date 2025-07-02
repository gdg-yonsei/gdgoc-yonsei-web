import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import localFont from 'next/font/local'

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
    <html className={`bg-neutral-50 ${googleSans.className}`}>
      <body>{children}</body>
    </html>
  )
}
