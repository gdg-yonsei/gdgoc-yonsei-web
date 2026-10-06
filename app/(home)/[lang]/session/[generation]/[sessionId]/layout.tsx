import type { ReactNode } from 'react'
import { getSessionStaticParams } from '@/lib/server/queries/public/static-params'

export async function generateStaticParams() {
  return getSessionStaticParams()
}

export default function SessionDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
