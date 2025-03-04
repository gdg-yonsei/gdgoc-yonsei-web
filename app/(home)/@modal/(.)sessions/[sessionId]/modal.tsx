'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div
      className={
        'w-full h-screen bg-neutral-500/50 fixed top-0 left-0 flex items-center justify-center p-4'
      }
    >
      <div
        className={
          'w-full h-full max-h-2/3 max-w-3xl bg-neutral-50 rounded-2xl relative overflow-y-scroll'
        }
      >
        <button
          type={'button'}
          onClick={() => router.back()}
          className={'absolute top-1 right-1'}
        >
          <XCircleIcon className={'size-8'} />
        </button>
        {children}
      </div>
    </div>
  )
}
