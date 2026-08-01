'use client'

import { useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'
import Github from '@/app/components/svg/github'

/**
 * Github 로그인 버튼
 * @constructor
 */
export default function GithubSubmitButton() {
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
      className={'admin-btn-primary w-full'}
      disabled={pending || isAuthenticating}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-5 border-2 border-white/30 border-t-white'}
        />
      ) : (
        <Github className={'size-5'} fill={'currentColor'} />
      )}
      <p>Sign in with Github</p>
    </button>
  )
}
