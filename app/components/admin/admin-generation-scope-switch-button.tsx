'use client'

import { type ReactNode } from 'react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAdminGenerationScopeAction } from '@/app/components/admin/admin-generation-scope-actions'

export default function AdminGenerationScopeSwitchButton({
  scopeValue,
  children,
}: {
  scopeValue: string
  children: ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type={'button'}
      className={
        'rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400'
      }
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setAdminGenerationScopeAction(scopeValue)
          router.refresh()
        })
      }}
    >
      {children}
    </button>
  )
}
