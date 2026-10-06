import {
  GenerationPageSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'

export default function MemberGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading members">
      <div className="archive-skeleton">
        <SkeletonBars count={6} className="h-20 w-full" />
      </div>
    </GenerationPageSkeleton>
  )
}
