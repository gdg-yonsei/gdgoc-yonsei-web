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

  /**
   * `stopLoadingState` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
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
      className={'button-white'}
      disabled={isLoading || isAuthenticating}
    >
      {isLoading ? (
        <LoadingSpinner
          className={'size-6 border-2 border-neutral-300 border-t-black'}
        />
      ) : (
        <KeyIcon className={'size-6'} />
      )}
      <p>Sign in with Passkey</p>
    </button>
  )
}
