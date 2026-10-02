'use client'

/**
 * 확인 모달을 거쳐 제출하는 버튼(클라이언트 컴포넌트). 삭제처럼 되돌릴 수 없는 동작에 쓴다.
 */
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState, modalState } from '@/lib/admin/atoms'
import { ReactNode, useRef } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 누르면 전역 모달(`modalState`)로 확인을 받고, 확인하면 숨겨 둔 submit 버튼을 대신 눌러 폼을 제출한다.
 *
 * 모달은 폼 바깥에 렌더링되므로 `form.requestSubmit()`을 직접 부를 수 없어, 폼 안의
 * 숨은 버튼을 ref로 클릭하는 방식으로 제출한다.
 * @param questionText 모달에 띄울 확인 문구
 */
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
            className={'border-hairline size-6 border-2 border-t-white'}
          />
        ) : (
          ''
        )}
        <p>{isLoading ? t('suspend') : (children ?? t('submit'))}</p>
      </button>
    </>
  )
}
