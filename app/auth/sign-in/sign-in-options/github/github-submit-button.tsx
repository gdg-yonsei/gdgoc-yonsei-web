'use client'

import { useFormStatus } from 'react-dom'
import Github from '@/public/logo/github.svg'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'
import { MouseEvent } from 'react'

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
   * isAuthenticating 상태를 true 로 변경하고, 클릭 이벤트 발생
   * @param e
   */
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    setIsAuthenticating(true)
    e.currentTarget.click()
  }

  return (
    <button
      type={'submit'}
      className={'button-black'}
      disabled={pending || isAuthenticating}
      onClick={handleClick}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-t-white border-neutral-700'}
        />
      ) : (
        <Github className={'size-6'} />
      )}
      <p>Sign in with Github</p>
    </button>
  )
}
