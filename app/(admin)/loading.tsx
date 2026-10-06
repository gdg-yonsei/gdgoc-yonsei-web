'use client'

import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function Loading() {
  const { t } = useAdminI18n()
  return (
    <div
      role={'status'}
      className={
        'fixed top-0 left-0 z-40 flex h-screen w-screen items-center justify-center'
      }
    >
      <LoadingSpinner />
      <span className={'sr-only'}>{t('loading')}</span>
    </div>
  )
}
