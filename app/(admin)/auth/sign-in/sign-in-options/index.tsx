import SignInWithGithub from '@/app/(admin)/auth/sign-in/sign-in-options/github'
import Passkey from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'
import SignInWithGoogle from '@/app/(admin)/auth/sign-in/sign-in-options/google'

/**
 * Sign In Options 을 표시하는 컴포넌트
 * @constructor
 */
export default function SignInOptions() {
  return (
    <div className={'flex w-full flex-col items-center gap-2 md:w-1/3'}>
      <SignInWithGithub />
      <SignInWithGoogle />
      <Passkey />
    </div>
  )
}
