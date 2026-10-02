/**
 * 관리자 목록이 비었을 때 보여 주는 공용 카드(서버/클라이언트 공용).
 */
import { InboxIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 빈 상태 카드(DESIGN.md `ex-empty-state-card`).
 *
 * 모든 관리자 목록이 같은 모양을 쓰도록 이 컴포넌트 하나로 모아 둔다.
 * @param title 제목
 * @param description 보조 설명
 * @param action 새 항목 만들기 같은 후속 동작 버튼
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
