'use client'

import { useTransition } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { authClient } from '@/lib/auth-client'

/**
 * Passkey 등록 버튼
 * @constructor
 */
export default function RegisterPasskeyButton() {
  const { t } = useAdminI18n()
  const [isPending, startTransition] = useTransition()

  function registerPasskey() {
    startTransition(async () => {
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
    })
  }

  return (
    <button
      type={'button'}
      className={'button-black mx-auto max-w-lg'}
      onClick={registerPasskey}
      disabled={isPending}
    >
      {t('registerPasskey')}
    </button>
  )
}
