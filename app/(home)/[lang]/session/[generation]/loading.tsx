import {
  GenerationPageSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'

export default function SessionGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading sessions">
      <div className="archive-skeleton">
        <SkeletonBars count={4} className="h-20 w-full" />
      </div>
    </GenerationPageSkeleton>
  )
}
