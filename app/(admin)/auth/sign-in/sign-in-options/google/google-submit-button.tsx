'use client'

import { useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'
import Google from '@/app/components/svg/google'

/**
 * Google 로그인 버튼
 * @constructor
 */
export default function GoogleSubmitButton() {
  const { pending } = useFormStatus()
  const [isAuthenticating, setIsAuthenticating] = useAtom(isAuthenticatingState)

  useEffect(() => {
    if (pending) {
      setIsAuthenticating(true)
    }
  }, [pending, setIsAuthenticating])

  return (
    <button
      type={'submit'}
      className={'admin-btn-secondary w-full'}
      disabled={pending || isAuthenticating}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-5 border-2 border-current/30 border-t-current'}
        />
      ) : (
        <Google className={'size-5'} fill={'currentColor'} />
      )}
      <p>Sign in with Google</p>
    </button>
  )
}
