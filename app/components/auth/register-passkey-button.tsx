'use client'

import { signIn } from 'next-auth/webauthn'

/**
 * Passkey 등록 버튼
 * @constructor
 */
export default function RegisterPasskeyButton() {
  return (
    <button
      type={'button'}
      className={'button-black mx-auto max-w-lg'}
      onClick={() =>
        signIn('passkey', { action: 'register' })
          .then(() => alert('The passkey has been registered.'))
          .catch(() => alert('The passkey is already registered.'))
      }
    >
      Register Passkey
    </button>
  )
}
