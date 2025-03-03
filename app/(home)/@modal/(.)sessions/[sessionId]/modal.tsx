'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div
      className={
        'w-full h-screen p-8 bg-neutral-500/50 fixed top-0 left-0 flex items-center justify-center'
      }
    >
      <div
        className={
          'w-full h-full max-w-2xl bg-neutral-50 rounded-2xl relative overflow-y-scroll'
        }
      >
        <button
          type={'button'}
          onClick={() => router.back()}
          className={'absolute top-2 right-2'}
        >
          <XCircleIcon className={'size-10'} />
        </button>
        {children}
      </div>
    </div>
  )
}
