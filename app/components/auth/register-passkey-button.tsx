'use client'

import { useTransition } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { authClient } from '@/lib/auth-client'

/** 이미 등록된 인증기는 ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED에 맞는 별도 문구로 안내한다. */
export default function RegisterPasskeyButton() {
  const { t } = useAdminI18n()
  const [isPending, startTransition] = useTransition()

  function registerPasskey() {
    startTransition(async () => {
      try {
        const result = await authClient.passkey.addPasskey()

        if (!result.error) {
          alert(t('registerPasskeySuccess'))
          return
        }

        alert(
          t(
            'code' in result.error &&
              result.error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'
              ? 'registerPasskeyAlreadyRegistered'
              : 'registerPasskeyError'
          )
        )
      } catch {
        alert(t('registerPasskeyError'))
      }
    })
  }

  return (
    <button
      type={'button'}
      className={'button-black mx-auto max-w-lg'}
      onClick={registerPasskey}
      disabled={isPending}
      aria-busy={isPending}
    >
      {t('registerPasskey')}
    </button>
  )
}
