/**
 * 로그인 화면의 로그인 방법 묶음(서버 컴포넌트).
 */
import SocialSignIn from '@/app/(admin)/auth/sign-in/sign-in-options/social-sign-in'
import PasskeySignInButton from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'

/**
 * 로그인 방법 목록: GitHub, Google, 패스키.
 */
export default function SignInOptions({
  callbackURL,
}: {
  /** 로그인 성공 후 이동할 경로. 기본은 관리자 홈, MCP 연결 중이면 OAuth authorize. */
  callbackURL: string
}) {
  return (
    <div className={'flex w-full flex-col gap-2'}>
      <SocialSignIn provider={'github'} callbackURL={callbackURL} />
      <SocialSignIn provider={'google'} callbackURL={callbackURL} />
      <PasskeySignInButton callbackURL={callbackURL} />
    </div>
  )
}
