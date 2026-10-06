import BackToPageButton from '@/app/components/admin/back-to-page-button'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import { SignOutButton } from '@/app/components/auth/sign-out-button'

/** 관리자 전용 오류 경계로 두어, 클라이언트 버튼이 모든 공개 페이지 번들에 실리지 않게 한다. */
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
