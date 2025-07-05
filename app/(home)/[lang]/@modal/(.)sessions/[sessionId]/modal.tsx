'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div
      className={
        'fixed top-0 left-0 z-20 flex h-screen w-full items-center justify-center bg-neutral-500/50 p-4'
      }
    >
      <div
        className={
          'relative h-full max-h-4/5 w-full max-w-4xl overflow-y-scroll rounded-2xl bg-neutral-50'
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
