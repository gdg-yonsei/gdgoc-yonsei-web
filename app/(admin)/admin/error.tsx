'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useAdminI18n()
  console.error(error)

  return (
    <div
      className={
        'flex min-h-[50vh] flex-col items-center justify-center gap-3 p-4 text-center'
      }
    >
      <ExclamationTriangleIcon
        className={'text-warning size-10'}
        aria-hidden={'true'}
      />
      <h2 className={'type-heading-3 text-ink'}>{t('errorOccurred')}</h2>
      <p className={'type-body-sm text-ink-muted max-w-prose'}>
        {t('errorOccurredHint')}
      </p>
      {error.message && (
        <code
          className={
            'bg-surface-sunken text-ink-muted type-caption max-w-full overflow-x-auto rounded-md px-3 py-1.5'
          }
        >
          {error.message}
        </code>
      )}
      <button onClick={reset} className={'admin-btn-primary mt-2'}>
        {t('tryAgain')}
      </button>
    </div>
  )
}
