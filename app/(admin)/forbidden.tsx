/**
 * 관리자 영역의 403 화면. `forbidden()`이 호출되면 Next가 이 파일을 렌더링한다.
 */
import BackToPageButton from '@/app/components/admin/back-to-page-button'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import { SignOutButton } from '@/app/components/auth/sign-out-button'

/**
 * 403 화면. 가입 승인 대기 중이거나 권한이 부족할 때 보인다.
 *
 * `forbidden()`은 관리자 라우트만 호출하므로 이 경계를 관리자 그룹 안에 둔다. 앱 루트에
 * 두면 이 화면의 클라이언트 버튼이 모든 공개 페이지 번들에 실린다.
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
