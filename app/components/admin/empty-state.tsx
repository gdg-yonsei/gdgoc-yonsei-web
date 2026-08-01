import { InboxIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 빈 상태 카드 (DESIGN.md `ex-empty-state-card`).
 *
 * 이전에는 같은 마크업이 5곳에 복붙되어 있었고 `shadow-sm` 유무처럼 미묘하게
 * 어긋나 있었습니다. `generations`에는 빈 상태가 아예 없었습니다.
 */
export default function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-hairline bg-canvas flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center',
        className
      )}
    >
      <InboxIcon className={'text-ink-faint size-8'} aria-hidden={'true'} />
      <div className={'type-title text-ink'}>{title}</div>
      {description && (
        <p className={'type-body-sm text-ink-muted max-w-prose'}>
          {description}
        </p>
      )}
      {action && <div className={'pt-2'}>{action}</div>}
    </div>
  )
}
