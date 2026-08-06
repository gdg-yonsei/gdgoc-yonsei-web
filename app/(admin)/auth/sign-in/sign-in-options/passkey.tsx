'use client'

import { signIn } from 'next-auth/webauthn'
import { useState } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'

/**
 * Passkey 로그인 버튼
 * @constructor
 */
export default function PasskeySignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useAtom(isAuthenticatingState)

  function stopLoadingState() {
    setIsLoading(false)
    setIsAuthenticating(false)
  }

  return (
    <button
      type={'button'}
      onClick={() => {
        setIsLoading(true)
        setIsAuthenticating(true)
        signIn('passkey').then(stopLoadingState).catch(stopLoadingState)
      }}
      className={'admin-btn-secondary w-full'}
      disabled={isLoading || isAuthenticating}
    >
      {isLoading ? (
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
