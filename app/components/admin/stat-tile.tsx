import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'

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
