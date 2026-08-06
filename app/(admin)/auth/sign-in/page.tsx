import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import SignInOptions from '@/app/(admin)/auth/sign-in/sign-in-options'
import { Metadata } from 'next'
import ErrorNotification from '@/app/(admin)/auth/sign-in/error-notification'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign In',
}

/**
 * Sing In Page
 *
 * DESIGN.md `ex-auth-form-card`: canvas 위에 hairline + soft shadow 카드.
 * 고정 높이(`h-1/2`)를 제거해 작은 화면에서 내용이 잘리지 않게 하고,
 * 셸과 동일하게 `lg:` 브레이크포인트로 통일했습니다.
 * @constructor
 */
export default function SignInPage() {
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
            <SignInOptions />
          </div>
        </div>

        <ErrorNotification />

        <div className={'border-hairline flex flex-col gap-2 border-t pt-4'}>
          <p className={'type-caption text-ink-muted'}>
            To log in using a passkey, you must first sign in with GitHub and
            then register a passkey.
          </p>
          <p className={'type-caption text-ink-faint'}>
            By signing up, you agree to our{' '}
            <Link
              href={'/privacy-policy'}
              className={'text-primary hover:underline'}
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href={'/terms-of-service'}
              className={'text-primary hover:underline'}
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
