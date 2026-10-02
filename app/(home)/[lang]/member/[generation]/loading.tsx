import {
  GenerationPageSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'

/** 기수 페이지 데이터를 기다리는 동안 보이는 스켈레톤. */
export default function MemberGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading members">
      <div className="archive-skeleton">
        <SkeletonBars count={6} className="h-20 w-full" />
      </div>
    </GenerationPageSkeleton>
  )
}
