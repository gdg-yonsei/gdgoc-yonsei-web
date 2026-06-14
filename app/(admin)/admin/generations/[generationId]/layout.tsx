import type { ReactNode } from 'react'
import { connection } from 'next/server'

export default async function AdminGenerationLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()

  return <>{children}</>
}
