import type { ReactNode } from 'react'
import { getProjectStaticParams } from '@/lib/server/queries/public/static-params'

export async function generateStaticParams() {
  return getProjectStaticParams()
}

export default function ProjectDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
