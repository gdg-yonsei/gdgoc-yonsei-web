/**
 * 기수별 프로젝트 페이지 로딩 스켈레톤.
 */
import {
  GenerationPageSkeleton,
  ProjectCardSkeletons,
} from '@/app/components/site/skeletons'

/** 기수 페이지 데이터를 기다리는 동안 보이는 스켈레톤. */
export default function ProjectGenerationLoading() {
  return (
    <GenerationPageSkeleton label="Loading projects">
      <div className="mt-8">
        <ProjectCardSkeletons />
      </div>
    </GenerationPageSkeleton>
  )
}
