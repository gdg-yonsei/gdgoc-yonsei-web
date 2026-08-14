import { auth } from '@/auth'
import GoogleSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/google/google-submit-button'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Github 로그인 버튼
 * @constructor
 */
export default function SignInWithGoogle() {
  return (
    <form
      action={async () => {
        'use server'
        const result = await auth.api.signInSocial({
          body: {
            provider: 'google',
            callbackURL: '/admin',
            errorCallbackURL: '/auth/sign-in',
          },
          headers: await headers(),
        })

        if (!result.url) {
          redirect('/auth/sign-in?error=Unable%20to%20start%20Google%20login')
        }
        redirect(result.url)
      }}
      className={'w-full'}
    >
      <GoogleSubmitButton />
    </form>
  )
}
