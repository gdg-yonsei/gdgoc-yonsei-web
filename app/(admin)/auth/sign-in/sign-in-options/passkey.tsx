'use client'

import { useTransition } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/admin/atoms'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

/**
 * Passkey 로그인 버튼
 */
export default function PasskeySignInButton({
  callbackURL,
}: {
  callbackURL: string
}) {
  const router = useRouter()
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
              // OAuth 요청을 이어 갈 때는 API 라우트로 가야 하므로 전체 이동한다.
              if (callbackURL.startsWith('/api/')) {
                window.location.assign(callbackURL)
              } else {
                router.replace(callbackURL)
              }
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
