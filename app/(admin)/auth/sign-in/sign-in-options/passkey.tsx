'use client'

import { useTransition } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'
import { authClient } from '@/lib/auth-client'

/**
 * Passkey 로그인 버튼
 * @constructor
 */
export default function PasskeySignInButton() {
  const [isPending, startTransition] = useTransition()
  const [isAuthenticating, setIsAuthenticating] = useAtom(isAuthenticatingState)

  return (
    <button
      type={'button'}
      onClick={() => {
        setIsAuthenticating(true)

        startTransition(async () => {
          try {
            const result = await authClient.signIn.passkey()
            if (!result.error) {
              window.location.assign('/admin')
            }
          } finally {
            setIsAuthenticating(false)
          }
        })
      }}
      className={'admin-btn-secondary w-full'}
      disabled={isPending || isAuthenticating}
    >
      {isPending ? (
        <LoadingSpinner
          className={'size-5 border-2 border-current/30 border-t-current'}
        />
      ) : (
        <KeyIcon className={'size-5'} aria-hidden={'true'} />
      )}
      <p>Sign in with Passkey</p>
    </button>
  )
}
