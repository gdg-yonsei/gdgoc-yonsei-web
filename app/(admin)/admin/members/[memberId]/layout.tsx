import type { ReactNode } from 'react'
import { connection } from 'next/server'

export default async function AdminMemberLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()

  return <>{children}</>
}
