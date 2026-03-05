'use client'

import { signIn } from 'next-auth/webauthn'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * Passkey 등록 버튼
 * @constructor
 */
export default function RegisterPasskeyButton() {
  const { t } = useAdminI18n()

  return (
    <button
      type={'button'}
      className={'button-black mx-auto max-w-lg'}
      onClick={() =>
        signIn('passkey', { action: 'register' })
          .then(() => alert(t('registerPasskeySuccess')))
          .catch(() => alert(t('registerPasskeyAlreadyRegistered')))
      }
    >
      {t('registerPasskey')}
    </button>
  )
}
