'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState, modalState } from '@/lib/admin/atoms'
import { ReactNode, useRef } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 모달이 폼 밖에 있어, 폼 안의 숨은 submit 버튼을 ref로 클릭해 확인 뒤 제출한다. */
export default function SubmitButton({
  className,
  questionText,
  children,
}: {
  className?: string
  questionText: string
  children?: ReactNode
}) {
  const { pending } = useFormStatus()
  const [isLoading] = useAtom(isLoadingState)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [, setModal] = useAtom(modalState)
  const { t } = useAdminI18n()

  return (
    <>
      <button
        type={'submit'}
        disabled={pending || isLoading}
        ref={submitButtonRef}
        hidden={true}
      ></button>
      <button
        type={'button'}
        disabled={pending || isLoading}
        aria-busy={pending || isLoading}
        className={className}
        onClick={() =>
          setModal({
            text: questionText,
            action: () => {
              submitButtonRef.current?.click()
              setModal({ text: '', action: () => {} })
            },
          })
        }
      >
        {pending ? (
          <LoadingSpinner
            className={'size-6 border-2 border-current/30 border-t-current'}
          />
        ) : (
          ''
        )}
        <p>{isLoading ? t('suspend') : (children ?? t('submit'))}</p>
      </button>
    </>
  )
}
