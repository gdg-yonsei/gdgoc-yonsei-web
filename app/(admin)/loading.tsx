/**
 * 관리자 영역의 기본 로딩 화면(페이지 단위 Suspense 대체 UI).
 */
import LoadingSpinner from '@/app/components/admin/loading-spinner'

/** 화면 가운데 스피너. */
export default function Loading() {
  return (
    <div
      className={
        'fixed top-0 left-0 z-40 flex h-screen w-screen items-center justify-center'
      }
    >
      <LoadingSpinner />
    </div>
  )
}
