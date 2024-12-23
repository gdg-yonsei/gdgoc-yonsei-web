import { ReactNode } from 'react'

export default function AdminDefaultLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`w-full min-h-screen pt-20 lg:pt-4 lg:pl-64 ${className}`}>
      {children}
    </div>
  )
}
