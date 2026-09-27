import SignInWithGithub from '@/app/(admin)/auth/sign-in/sign-in-options/github'
import PasskeySignInButton from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'
import SignInWithGoogle from '@/app/(admin)/auth/sign-in/sign-in-options/google'

/**
 * Sign In Options 을 표시하는 컴포넌트
 * @constructor
 */
export default function SignInOptions({
  callbackURL,
}: {
  /** 로그인 성공 후 이동할 경로. 기본은 관리자 홈, MCP 연결 중이면 OAuth authorize. */
  callbackURL: string
}) {
  return (
    <div className={'flex w-full flex-col gap-2'}>
      <SignInWithGithub callbackURL={callbackURL} />
      <SignInWithGoogle callbackURL={callbackURL} />
      <PasskeySignInButton callbackURL={callbackURL} />
    </div>
  )
}
