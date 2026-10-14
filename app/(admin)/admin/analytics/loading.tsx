/** 탭 사이 첫 이동 때의 자리 표시. 필터를 바꿀 때는 transition이 이전 화면을 유지하므로 보이지 않는다. */
import { AdminCardSkeleton } from '@/app/components/admin/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className={'grid gap-3 md:grid-cols-3'}>
      <AdminCardSkeleton />
      <AdminCardSkeleton />
      <AdminCardSkeleton />
    </div>
  )
}
