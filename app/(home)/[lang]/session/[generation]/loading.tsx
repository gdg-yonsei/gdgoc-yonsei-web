/**
 * 기수별 세션 페이지 로딩 스켈레톤.
 */
import {
  GenerationPageSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'

/** 기수 페이지 데이터를 기다리는 동안 보이는 스켈레톤. */
export default function SessionGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading sessions">
      <div className="archive-skeleton">
        <SkeletonBars count={4} className="h-20 w-full" />
      </div>
    </GenerationPageSkeleton>
  )
}
