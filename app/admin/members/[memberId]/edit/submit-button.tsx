'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'

export default function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type={'submit'}
      className={
        'bg-neutral-950 text-white p-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all text-lg col-span-1 sm:col-span-2'
      }
      disabled={pending}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-t-white border-neutral-700'}
        />
      ) : (
        ''
      )}
      <p>Submit</p>
    </button>
  )
}
