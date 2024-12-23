import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import localFont from 'next/font/local'

export const metadata: Metadata = {
  title: 'GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
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
    </html>
  )
}
