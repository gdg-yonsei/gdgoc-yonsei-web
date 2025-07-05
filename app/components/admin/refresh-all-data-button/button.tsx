'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'

export default function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type={'submit'}
      className={
        'flex w-full items-center justify-center gap-2 rounded-full border-2 border-neutral-900 p-2 px-4 text-sm transition-all hover:bg-neutral-100'
      }
      disabled={pending}
    >
      {pending && (
        <LoadingSpinner
          className={'size-4 border-2 border-neutral-700 border-t-white'}
        />
      )}
      {pending ? 'Refresh...' : 'Refresh All Data'}
    </button>
  )
}
