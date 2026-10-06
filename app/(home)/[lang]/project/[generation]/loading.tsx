import {
  GenerationPageSkeleton,
  ProjectCardSkeletons,
} from '@/app/components/site/skeletons'

export default function ProjectGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading projects">
      <div className="mt-8">
        <ProjectCardSkeletons />
      </div>
    </GenerationPageSkeleton>
  )
}
