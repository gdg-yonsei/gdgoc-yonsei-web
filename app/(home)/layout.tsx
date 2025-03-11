import type { Metadata } from 'next'
import '../globals.css'
import { ReactNode } from 'react'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: 'GDGoC Yonsei',
    template: '%s | GDGoC Yonsei',
  },
  description: 'Google Developer Group on Campus Yonsei University',
}

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: ReactNode
  modal: ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
      {modal}
      <Footer />
    </>
  )
}
