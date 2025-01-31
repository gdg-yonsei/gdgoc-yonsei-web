'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isLoadingState } from '@/lib/atoms'

/**
 * Form Submit Button Component
 * @constructor
 */
export default function SubmitButton() {
  const { pending } = useFormStatus()
  const [isLoading] = useAtom(isLoadingState)

  return (
    <button
      type={'submit'}
      className={
        'bg-neutral-950 text-white p-2 px-4 disabled:bg-neutral-600 rounded-xl flex items-center justify-center gap-2 hover:not-disabled:bg-neutral-800 transition-all text-lg col-span-1 sm:col-span-2'
      }
      disabled={pending || isLoading}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-t-white border-neutral-700'}
        />
      ) : (
        ''
      )}
      <p>{isLoading ? 'Suspend...' : 'Submit'}</p>
    </button>
  )
}
