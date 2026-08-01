'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/atoms'
import { ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

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
      className={cn('admin-btn-primary admin-form-grid-full', className)}
      disabled={pending || isLoading}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-5 border-2 border-white/40 border-t-white'}
        />
      ) : null}
      <span>{isLoading ? t('suspend') : (children ?? t('submit'))}</span>
    </button>
  )
}
