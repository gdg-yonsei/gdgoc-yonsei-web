'use client'

/** 패스키는 로그인 후 프로필 화면에서 먼저 등록해야 한다. */
import { useState, useTransition } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { useAtom } from 'jotai'
import { isAuthenticatingState } from '@/lib/admin/atoms'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function PasskeySignInButton({
  callbackURL,
}: {
  callbackURL: string
}) {
  const router = useRouter()
  const { t } = useAdminI18n()
  const [hasFailed, setHasFailed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isAuthenticating, setIsAuthenticating] = useAtom(isAuthenticatingState)

  return (
    <div className={'flex flex-col gap-2'}>
      <button
        type={'button'}
        onClick={() => {
          setIsAuthenticating(true)
          setHasFailed(false)

          startTransition(async () => {
            try {
              const result = await authClient.signIn.passkey()
              if (result.error) {
                setHasFailed(true)
              } else {
                // OAuth 요청을 이어 갈 때는 API 라우트로 가야 하므로 전체 이동한다.
                if (callbackURL.startsWith('/api/')) {
                  window.location.assign(callbackURL)
                } else {
                  router.replace(callbackURL)
                }
              }
            } catch {
              setHasFailed(true)
            } finally {
              setIsAuthenticating(false)
            }
          })
        }}
        className={'admin-btn-secondary w-full'}
        disabled={isPending || isAuthenticating}
        aria-busy={isPending || isAuthenticating}
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
      {hasFailed && (
        <p role={'alert'} className={'text-danger type-caption'}>
          {t('passkeySignInError')}
        </p>
      )}
    </div>
  )
}
