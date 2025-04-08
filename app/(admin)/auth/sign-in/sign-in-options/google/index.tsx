import { signIn } from '@/auth'
import GoogleSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/google/google-submit-button'

/**
 * Github 로그인 버튼
 * @constructor
 */
export default function SignInWithGoogle() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google')
      }}
      className={'w-full'}
    >
      <GoogleSubmitButton />
    </form>
  )
}
