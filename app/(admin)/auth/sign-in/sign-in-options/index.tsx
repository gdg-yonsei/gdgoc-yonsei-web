import SocialSignIn from '@/app/(admin)/auth/sign-in/sign-in-options/social-sign-in'
import PasskeySignInButton from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'

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
