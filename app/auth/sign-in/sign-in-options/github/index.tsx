import GithubSubmitButton from '@/app/auth/sign-in/sign-in-options/github/github-submit-button'
import { signIn } from '@/auth'

/**
 * Github 로그인 버튼
 * @constructor
 */
export default function SignInWithGithub() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('github')
      }}
      className={'w-full'}
    >
      <GithubSubmitButton />
    </form>
  )
}
