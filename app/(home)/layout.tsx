import type { Metadata } from 'next'
import '../globals.css'
import { ReactNode } from 'react'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'

export const metadata: Metadata = {
  title: 'GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
