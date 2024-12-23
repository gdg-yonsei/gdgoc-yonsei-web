import SignInWithGithub from '@/app/components/auth/sign-in-options/github'
import Passkey from '@/app/components/auth/sign-in-options/passkey'

export default function SignInOptions() {
  return (
    <div className={'w-full md:w-1/3 flex flex-col items-center gap-2'}>
      <SignInWithGithub />
      <Passkey />
    </div>
  )
}
