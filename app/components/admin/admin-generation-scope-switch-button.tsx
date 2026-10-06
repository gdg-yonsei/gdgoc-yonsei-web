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
      className={'admin-btn-primary min-h-9'}
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
