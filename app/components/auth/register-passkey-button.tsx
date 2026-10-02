'use client'

/**
 * 패스키 등록 버튼(클라이언트 컴포넌트). 관리자 프로필 화면에서 Better Auth passkey 플러그인으로 현재 기기를 등록한다.
 */
import { useTransition } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { authClient } from '@/lib/auth-client'

/**
 * 브라우저 WebAuthn 등록 흐름을 띄우고 결과를 alert로 알린다.
 *
 * 이미 등록된 인증기(`ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED`)는 일반 오류와 다른 문구로 안내한다.
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
