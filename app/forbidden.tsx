import BackToPageButton from '@/app/components/back-to-page-button'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import { SignOutButton } from '@/app/components/auth/sign-out-button'

/**
 * 403 Forbidden Page
 * @constructor
 */
export default function Forbidden() {
  return (
    <div
      className={
        'flex h-screen w-screen items-center justify-center bg-neutral-100 p-4'
      }
    >
      <div
        className={
          'flex w-full max-w-xl flex-col gap-4 rounded-xl bg-white p-8'
        }
      >
        <GDGoCYonseiLogo />
        <h1 className={'text-5xl font-bold md:text-6xl'}>403 Forbidden</h1>
        <p>
          If you have just signed up, please wait until the administrator grants
          you permission.
        </p>
        <p>
          You cannot access data with your current user account permissions.
        </p>
        <BackToPageButton />
        <SignOutButton />
      </div>
    </div>
  )
}
