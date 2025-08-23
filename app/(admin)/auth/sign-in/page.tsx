import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import SignInOptions from '@/app/(admin)/auth/sign-in/sign-in-options'
import { Metadata } from 'next'
import ErrorNotification from '@/app/(admin)/auth/sign-in/error-notification'

export const metadata: Metadata = {
  title: 'Sign In',
}

/**
 * Sing In Page
 * @constructor
 */
export default function SignInPage() {
  return (
    <div
      className={
        'flex h-screen w-screen flex-col items-center justify-center p-4'
      }
    >
      <div
        className={
          'relative flex h-1/2 w-full max-w-3xl flex-col items-center rounded-xl bg-white p-8 shadow-xl md:rounded-2xl'
        }
      >
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 md:flex-row md:justify-around">
          <GDGoCYonseiLogo className={'top-0 left-0 mr-auto md:absolute'} />
          <div className={'flex w-full flex-col gap-4 md:w-2/3'}>
            <div
              className={
                'flex flex-col items-start gap-1 text-2xl font-bold md:text-4xl'
              }
            >
              <h1>GDGoC Yonsei</h1>
              <h1>Management System</h1>
            </div>
          </div>
          <SignInOptions />
        </div>
        <ErrorNotification />
        <p className={'text-xs'}>
          To log in using a passkey, you must first sign in with GitHub and then
          register a passkey.
        </p>
      </div>
    </div>
  )
}
