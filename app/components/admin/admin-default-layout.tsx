import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** 앱 바·사이드바·하단 탭 여백은 admin/layout의 main이 처리하므로 여기서는 세로 간격만 준다. */
export default function AdminDefaultLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {children}
    </div>
  )
}
