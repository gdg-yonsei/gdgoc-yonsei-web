import GithubSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/github/github-submit-button'
import { auth } from '@/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Github 로그인 버튼
 * @constructor
 */
export default function SignInWithGithub() {
  return (
    <form
      action={async () => {
        'use server'
        const result = await auth.api.signInSocial({
          body: {
            provider: 'github',
            callbackURL: '/admin',
            errorCallbackURL: '/auth/sign-in',
          },
          headers: await headers(),
        })

        if (!result.url) {
          redirect('/auth/sign-in?error=Unable%20to%20start%20GitHub%20login')
        }
        redirect(result.url)
      }}
      className={'w-full'}
    >
      <GithubSubmitButton />
    </form>
  )
}
