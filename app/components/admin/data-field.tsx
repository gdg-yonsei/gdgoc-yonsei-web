import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 상세 페이지의 읽기 전용 필드.
 *
 * `admin-card` + `admin-field-label` + `admin-field-value` 3중 구조가 멤버 상세에
 * 12번, 프로젝트 상세에 8번 손으로 반복되어 있던 것을 하나로 모읍니다.
 */
export default function DataField({
  label,
  value,
  fallback = '—',
  className,
  children,
}: {
  label: ReactNode
  value?: ReactNode
  /** value가 비었을 때 표시할 값 */
  fallback?: ReactNode
  className?: string
  children?: ReactNode
}) {
  const isEmpty =
    children === undefined &&
    (value === null || value === undefined || value === '')

  return (
    <div className={cn('admin-card flex flex-col gap-1', className)}>
      <div className={'admin-field-label'}>{label}</div>
      <div
        className={cn(
          'admin-field-value',
          isEmpty && 'text-ink-faint font-normal'
        )}
      >
        {children ?? (isEmpty ? fallback : value)}
      </div>
    </div>
  )
}
