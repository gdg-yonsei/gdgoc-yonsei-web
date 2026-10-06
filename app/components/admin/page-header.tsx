import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
  meta,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  backHref?: string
  backLabel?: string
  actions?: ReactNode

  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {backHref && (
        <Link
          href={backHref}
          className={
            'text-ink-muted hover:text-ink type-body-sm focus-visible:outline-primary -ml-1 inline-flex w-fit items-center gap-1 rounded-sm py-1 pr-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
          }
        >
          <ChevronLeftIcon className={'size-4'} aria-hidden={'true'} />
          {backLabel}
        </Link>
      )}
      <div
        className={
          'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
        }
      >
        <div className={'flex min-w-0 flex-col gap-1'}>
          <div className={'flex flex-wrap items-center gap-2'}>
            <h1 className={'admin-title min-w-0'}>{title}</h1>
            {meta}
          </div>
          {description && (
            <p className={'type-body-sm text-ink-muted'}>{description}</p>
          )}
        </div>
        {actions && (
          <div className={'flex shrink-0 flex-wrap items-center gap-2'}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
