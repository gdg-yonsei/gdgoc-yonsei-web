/**
 * 소셜(GitHub·Google) 로그인 폼(서버 컴포넌트).
 *
 * 폼을 제출하면 Server Action이 Better Auth로 OAuth 로그인을 시작하고, 제공자의 인증
 * 화면으로 redirect한다. 로그인이 끝나면 `callbackURL`로 돌아온다.
 */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import SocialSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/social-submit-button'
import {
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/app/(admin)/auth/sign-in/sign-in-options/social-providers'

/**
 * 제공자 하나의 로그인 폼.
 * @param provider 로그인 제공자
 * @param callbackURL 로그인 성공 후 이동할 경로(관리자 홈 또는 이어 갈 MCP OAuth 요청)
 */
export default function SocialSignIn({
  provider,
  callbackURL,
}: {
  provider: SocialProvider
  callbackURL: string
}) {
  return (
    <form
      action={async () => {
        'use server'
        const result = await auth.api.signInSocial({
          body: {
            provider,
            callbackURL,
            errorCallbackURL: '/auth/sign-in',
          },
          headers: await headers(),
        })

        if (!result.url) {
          redirect(
            `/auth/sign-in?error=${encodeURIComponent(SOCIAL_PROVIDERS[provider].startError)}`
          )
        }
        redirect(result.url)
      }}
      className={'w-full'}
    >
      <SocialSubmitButton provider={provider} />
    </form>
  )
}
