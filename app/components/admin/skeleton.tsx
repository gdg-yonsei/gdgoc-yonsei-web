/** 실제 표·카드와 같은 모양으로 만들어 데이터 도착 때 레이아웃 이동을 줄인다. */
'use client'

import { cn } from '@/lib/cn'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  const { t } = useAdminI18n()
  return (
    <div className={'admin-table'} role={'status'}>
      <span className={'sr-only'}>{t('loading')}</span>
      <div aria-hidden={'true'}>
        <div className={'border-hairline bg-canvas h-10 border-b'} />
        <div className={'flex flex-col'}>
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5',
                index > 0 && 'border-hairline border-t'
              )}
            >
              <div
                className={
                  'bg-surface-sunken h-4 flex-1 animate-pulse rounded motion-reduce:animate-none'
                }
              />
              <div
                className={
                  'bg-surface-sunken hidden h-4 w-24 animate-pulse rounded motion-reduce:animate-none lg:block'
                }
              />
              <div
                className={
                  'bg-surface-sunken hidden h-4 w-20 animate-pulse rounded motion-reduce:animate-none lg:block'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminCardSkeleton({ className }: { className?: string }) {
  const { t } = useAdminI18n()
  return (
    <div
      role={'status'}
      className={cn(
        'border-hairline bg-surface-sunken h-28 w-full animate-pulse rounded-lg border motion-reduce:animate-none',
        className
      )}
    >
      <span className={'sr-only'}>{t('loading')}</span>
    </div>
  )
}
