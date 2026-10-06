'use client'

/** 인증 흐름이 겹치지 않도록 진행 중인 로그인 하나가 다른 로그인 버튼도 잠근다. */
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
      aria-busy={pending}
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
