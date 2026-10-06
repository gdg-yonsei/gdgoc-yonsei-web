import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import SignInOptions from '@/app/(admin)/auth/sign-in/sign-in-options'
import { Metadata } from 'next'
import ErrorNotification from '@/app/(admin)/auth/sign-in/error-notification'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/auth'
import { getAdminLocale } from '@/lib/admin-i18n/server'
import { localizeAdminHref } from '@/lib/admin-i18n'
import { oauthQueryString, postLoginPath } from '@/lib/mcp/consent'

export const metadata: Metadata = {
  title: 'Sign In',
}

/** DESIGN.md `ex-auth-form-card`를 따르며, 작은 화면에서 내용이 잘리지 않게 높이를 고정하지 않는다. */
export default async function SignInPage({
  searchParams,
}: PageProps<'/auth/sign-in'>) {
  // MCP 클라이언트의 OAuth 요청으로 왔다면 로그인 뒤 그 요청을 이어 간다.
  const query = oauthQueryString(await searchParams)
  const callbackURL = postLoginPath(query)

  const session = await getAuthSession()

  if (session) {
    return redirect(
      callbackURL === '/admin'
        ? localizeAdminHref('/admin', await getAdminLocale())
        : callbackURL
    )
  }

  return (
    <div
      className={
        'bg-canvas flex min-h-dvh w-full items-center justify-center p-4'
      }
    >
      <div
        className={
          'border-hairline bg-surface shadow-soft flex w-full max-w-3xl flex-col gap-6 rounded-xl border p-6 sm:p-8'
        }
      >
        <div
          className={
            'flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-10'
          }
        >
          <div className={'flex min-w-0 flex-col gap-4 lg:flex-1'}>
            <GDGoCYonseiLogo className={'h-10 w-auto'} />
            <div className={'flex flex-col gap-0.5'}>
              <h1 className={'type-heading-2 lg:type-heading-1 text-ink'}>
                GDGoC Yonsei
              </h1>
              <p className={'type-title text-ink-muted'}>Management System</p>
            </div>
          </div>
          <div className={'w-full lg:w-64'}>
            <SignInOptions callbackURL={callbackURL} />
          </div>
        </div>

        <ErrorNotification />

        <div className={'border-hairline flex flex-col gap-2 border-t pt-4'}>
          <p className={'type-caption text-ink-muted'}>
            To log in using a passkey, first sign in with GitHub or Google and
            register a passkey from your profile.
          </p>
          <p className={'type-caption text-ink-faint'}>
            By signing up, you agree to our{' '}
            <Link
              href={'/privacy-policy'}
              className={'text-primary underline underline-offset-2'}
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href={'/terms-of-service'}
              className={'text-primary underline underline-offset-2'}
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
