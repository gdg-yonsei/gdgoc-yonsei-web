'use client'

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

  /**
   * 로그인 버튼 클릭 처리 함수
   *
   * isAuthenticating 상태를 true로 변경해 중복 제출을 방지합니다.
   */
  function handleSignInClick() {
    setIsAuthenticating(true)
  }

  return (
    <button
      type={'submit'}
      className={'button-black'}
      disabled={pending || isAuthenticating}
      onClick={handleSignInClick}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-neutral-700 border-t-white'}
        />
      ) : (
        <Github className={'size-6'} fill={'white'} />
      )}
      <p>Sign in with Github</p>
    </button>
  )
}
