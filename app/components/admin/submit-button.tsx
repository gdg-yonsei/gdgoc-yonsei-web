'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/admin/atoms'
import { ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/** 업로드 중 제출하면 이미지 URL 없이 저장될 수 있어, 제출 상태와 업로드 상태를 모두 확인한다. */
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
      aria-busy={pending || isLoading}
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
