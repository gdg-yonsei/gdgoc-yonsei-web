'use client'

/**
 * 관리자 폼 공용 제출 버튼(클라이언트 컴포넌트).
 */
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/admin/atoms'
import { ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/**
 * 제출 중(`useFormStatus`)이거나 이미지 업로드 중(`isLoadingState`)이면 비활성화되는 제출 버튼.
 *
 * 업로드가 끝나기 전에 제출하면 이미지 URL이 빠진 채 저장되므로 업로드 상태도 함께 본다.
 * @param children 버튼 문구(생략하면 "제출")
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
