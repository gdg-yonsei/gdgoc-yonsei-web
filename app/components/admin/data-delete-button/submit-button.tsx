'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState, modalState } from '@/lib/atoms'
import { ReactNode, useRef } from 'react'

/**
 * Form Submit Button Component
 * @constructor
 */
export default function SubmitButton({
  className,
  questionText,
  children = 'Submit',
}: {
  className?: string
  questionText: string
  children?: ReactNode
}) {
  const { pending } = useFormStatus()
  const [isLoading] = useAtom(isLoadingState)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [, setModal] = useAtom(modalState)

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
            className={'size-6 border-2 border-neutral-700 border-t-white'}
          />
        ) : (
          ''
        )}
        <p>{isLoading ? 'Suspend...' : children}</p>
      </button>
    </>
  )
}
