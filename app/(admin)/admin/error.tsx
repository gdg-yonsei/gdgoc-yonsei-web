'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  /** 오류 경계 안쪽을 서버에서 다시 받아 그린다(Next 16.3 권장 복구 방식). */
  retry: () => void
}) {
  const { t } = useAdminI18n()
  // 렌더 중 부수 효과를 피하려고 effect에서 브라우저 콘솔에 남긴다.
  useEffect(() => {
    console.error(error)
  }, [error])

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
      <button onClick={() => retry()} className={'admin-btn-primary mt-2'}>
        {t('tryAgain')}
      </button>
    </div>
  )
}
