'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/atoms'
import { ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * Form Submit Button Component
 * @constructor
 */
export default function SubmitButton({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  const { pending } = useFormStatus()
  const [isLoading] = useAtom(isLoadingState)
  const { t } = useAdminI18n()

  return (
    <button
      type={'submit'}
      className={
        className
          ? className
          : 'col-span-1 flex items-center justify-center gap-2 rounded-xl bg-neutral-950 p-2 px-4 text-lg text-white transition-all hover:not-disabled:bg-neutral-800 disabled:bg-neutral-600 sm:col-span-2'
      }
      disabled={pending || isLoading}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-neutral-700 border-t-white'}
        />
      ) : (
        ''
      )}
      <p>{isLoading ? t('suspend') : (children ?? t('submit'))}</p>
    </button>
  )
}
