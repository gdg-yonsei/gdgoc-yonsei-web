import type { ReactNode } from 'react'
import { connection } from 'next/server'

export default async function AdminSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()

  return <>{children}</>
}
