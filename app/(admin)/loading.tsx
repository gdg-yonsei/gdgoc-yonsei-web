import { Suspense } from 'react'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

// This fallback renders before the child layout's locale provider exists.
async function LoadingStatus() {
  const locale = await getAdminLocale()
  return (
    <div role={'status'} lang={locale}>
      <LoadingSpinner />
      <span className={'sr-only'}>{getAdminMessages(locale).loading}</span>
    </div>
  )
}

export default function Loading() {
  return (
    <div
      className={
        'fixed top-0 left-0 z-40 flex h-screen w-screen items-center justify-center'
      }
    >
      <Suspense fallback={<LoadingSpinner />}>
        <LoadingStatus />
      </Suspense>
    </div>
  )
}
