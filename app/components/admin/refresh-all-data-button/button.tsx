'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'

export default function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type={'submit'}
      className={
        'p-2 text-sm rounded-full border-2 w-full justify-center border-neutral-900 px-4 hover:bg-neutral-100 transition-all flex items-center gap-2'
      }
      disabled={pending}
    >
      {pending && (
        <LoadingSpinner
          className={'size-4 border-2 border-t-white border-neutral-700'}
        />
      )}
      {pending ? 'Refresh...' : 'Refresh All Data'}
    </button>
  )
}
