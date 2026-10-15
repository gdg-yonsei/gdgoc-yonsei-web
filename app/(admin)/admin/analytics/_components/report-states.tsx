'use client'

/** 보고서의 빈 상태와 오류 상태. 오류는 그 탭 안에만 보이고 필터 바·탭은 그대로 쓸 수 있다. */
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { formatAdminDate } from '@/lib/admin-i18n'
import { ANALYTICS_TIMEOUT_MESSAGE } from '@/lib/analytics/messages'
import { fillTemplate } from '@/lib/format/text'

export function ReportError({ message }: { message: string }) {
  const { t } = useAdminI18n()
  return (
    <div
      role={'alert'}
      className={'admin-card border-danger/40 flex items-start gap-3'}
    >
      <ExclamationTriangleIcon
        className={'text-danger size-5 shrink-0'}
        aria-hidden={'true'}
      />
      <p className={'type-body-sm text-ink'}>
        {message === ANALYTICS_TIMEOUT_MESSAGE
          ? t('analyticsTimeout')
          : message}
      </p>
    </div>
  )
}

export function ReportEmpty({
  collectingSince,
}: {
  collectingSince: string | null
}) {
  const { t, locale } = useAdminI18n()
  const hint = collectingSince
    ? fillTemplate(t('analyticsCollectingSince'), {
        date: formatAdminDate(collectingSince, locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Seoul',
        }),
      })
    : t('analyticsNoDataHint')
  return <AdminEmptyState title={t('analyticsNoData')} description={hint} />
}
