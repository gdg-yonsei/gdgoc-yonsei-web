'use client'

import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/atoms'
import { MouseEvent } from 'react'
import Google from '@/app/components/svg/google'

/**
 * Google 로그인 버튼
 * @constructor
 */
export default function GoogleSubmitButton() {
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
      className={
        'flex w-full items-center justify-center gap-2 rounded-full border-2 border-neutral-900 bg-neutral-50 p-2 px-4 transition-all disabled:bg-neutral-100'
      }
      disabled={pending || isAuthenticating}
      onClick={handleClick}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-6 border-2 border-neutral-700 border-t-white'}
        />
      ) : (
        <Google className={'size-6'} fill={'white'} />
      )}
      <p>Sign in with Google</p>
    </button>
  )
}
