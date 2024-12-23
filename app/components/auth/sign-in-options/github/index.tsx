import GithubSubmitButton from '@/app/components/auth/sign-in-options/github/github-submit-button'
import { signIn } from '@/auth'

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
