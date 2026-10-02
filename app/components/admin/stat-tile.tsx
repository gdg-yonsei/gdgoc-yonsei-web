/**
 * 관리자 대시보드 통계 타일(서버/클라이언트 공용).
 */
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'

/**
 * 대시보드 통계 타일.
 *
 * 숫자만 보여 주지 않고 해당 목록으로 바로 이동하는 링크로 만든다. 대시보드에서
 * 관리자가 가장 자주 하는 다음 행동이 목록 확인이기 때문이다.
 * @param label 지표 이름
 * @param value 표시할 값
 * @param href 눌렀을 때 이동할 목록 경로
 * @param icon heroicons 아이콘 컴포넌트
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
