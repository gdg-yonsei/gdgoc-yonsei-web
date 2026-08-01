import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'

/**
 * 대시보드 통계 타일.
 *
 * 숫자를 보여주는 데서 끝나지 않고 해당 목록으로 바로 이동시킵니다 —
 * 관리자가 대시보드에서 가장 자주 하는 다음 행동이 그것이기 때문입니다.
 */
export default function AdminStatTile({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: number | string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <Link
      href={href}
      className={
        'border-hairline bg-surface hover:border-primary/40 hover:shadow-soft focus-visible:outline-primary flex flex-col gap-2 rounded-lg border p-4 transition-all focus-visible:outline-2 focus-visible:outline-offset-2'
      }
    >
      <div className={'text-ink-muted flex items-center gap-2'}>
        <Icon className={'size-4'} aria-hidden={'true'} />
        <span className={'type-eyebrow uppercase'}>{label}</span>
      </div>
      <div className={'type-heading-1 text-ink tabular-nums'}>{value}</div>
    </Link>
  )
}
