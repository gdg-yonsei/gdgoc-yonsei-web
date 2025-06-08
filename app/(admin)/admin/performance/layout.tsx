import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ReactNode } from 'react'

export default function PerformanceLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AdminDefaultLayout>{children}</AdminDefaultLayout>
}
