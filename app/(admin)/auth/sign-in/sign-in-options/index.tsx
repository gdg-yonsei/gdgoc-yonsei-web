import SignInWithGithub from '@/app/(admin)/auth/sign-in/sign-in-options/github'
import Passkey from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'
import SignInWithGoogle from '@/app/(admin)/auth/sign-in/sign-in-options/google'

/**
 * Sign In Options 을 표시하는 컴포넌트
 * @constructor
 */
export default function SignInOptions() {
  return (
    <div className={'w-full md:w-1/3 flex flex-col items-center gap-2'}>
      <SignInWithGithub />
      <SignInWithGoogle />
      <Passkey />
    </div>
  )
}
