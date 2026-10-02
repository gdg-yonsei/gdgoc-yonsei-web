'use client'

/**
 * 소셜 로그인 제출 버튼(클라이언트 컴포넌트).
 *
 * 한 로그인 방식이 진행 중이면 전역 atom(`isAuthenticatingState`)으로 다른 로그인 버튼까지
 * 막아, 여러 인증 흐름이 동시에 시작되지 않게 한다.
 */
import { useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useAtom } from 'jotai'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import Github from '@/app/components/svg/github'
import Google from '@/app/components/svg/google'
import { isAuthenticatingState } from '@/lib/admin/atoms'
import {
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/app/(admin)/auth/sign-in/sign-in-options/social-providers'

/** 제공자별 아이콘과 버튼 모양. GitHub이 주 버튼, Google이 보조 버튼이다. */
const APPEARANCE = {
  github: {
    Icon: Github,
    buttonClass: 'admin-btn-primary w-full',
    spinnerClass: 'size-5 border-2 border-white/30 border-t-white',
  },
  google: {
    Icon: Google,
    buttonClass: 'admin-btn-secondary w-full',
    spinnerClass: 'size-5 border-2 border-current/30 border-t-current',
  },
} as const

/**
 * 제출 중이면 스피너를 보여 주는 로그인 버튼.
 * @param provider 로그인 제공자
 */
export default function SocialSubmitButton({
  provider,
}: {
  provider: SocialProvider
}) {
  const { pending } = useFormStatus()
  const [isAuthenticating, setIsAuthenticating] = useAtom(isAuthenticatingState)
  const { Icon, buttonClass, spinnerClass } = APPEARANCE[provider]

  // 제출이 실제로 시작된 뒤에만 잠근다. 제출이 막히면(pending이 되지 않으면) 버튼은 그대로 쓸 수 있다.
  useEffect(() => {
    if (pending) {
      setIsAuthenticating(true)
    }
  }, [pending, setIsAuthenticating])

  return (
    <button
      type={'submit'}
      className={buttonClass}
      disabled={pending || isAuthenticating}
    >
      {pending ? (
        <LoadingSpinner className={spinnerClass} />
      ) : (
        <Icon className={'size-5'} fill={'currentColor'} />
      )}
      <p>{SOCIAL_PROVIDERS[provider].label}</p>
    </button>
  )
}
