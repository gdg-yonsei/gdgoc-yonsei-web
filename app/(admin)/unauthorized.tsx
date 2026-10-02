/**
 * 관리자 영역의 401 화면. `unauthorized()`가 호출되면 Next가 이 파일을 렌더링한다.
 */
import BackToPageButton from '@/app/components/admin/back-to-page-button'

/** 인증이 필요하다는 안내와 뒤로 가기 버튼. */
export default function Unauthorized() {
  return (
    <div
      className={
        'flex h-screen w-screen items-center justify-center bg-neutral-100 p-4'
      }
    >
      <div
        className={
          'flex w-full max-w-xl flex-col gap-2 rounded-xl bg-white p-8'
        }
      >
        <h2 className={'text-2xl font-bold lg:text-4xl'}>401 Unauthorized</h2>
        <p>You are not authorized to access this resource.</p>
        <BackToPageButton />
      </div>
    </div>
  )
}
