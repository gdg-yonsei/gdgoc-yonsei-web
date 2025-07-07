import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
