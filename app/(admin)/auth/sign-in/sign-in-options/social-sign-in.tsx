import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import SocialSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/social-submit-button'
import {
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/app/(admin)/auth/sign-in/sign-in-options/social-providers'

/** `callbackURL`은 관리자 홈 또는 로그인 뒤 이어 갈 MCP OAuth 요청이다. */
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
