import { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { getSiteEnv } from '@/lib/server/env'

const siteEnv = getSiteEnv()

export const metadata: Metadata = {
  metadataBase: new URL(siteEnv.NEXT_PUBLIC_SITE_URL),
  applicationName: 'GDGoC Yonsei',
  creator: 'GDGoC Yonsei',
  publisher: 'GDGoC Yonsei',
  category: 'technology',
  referrer: 'origin-when-cross-origin',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
