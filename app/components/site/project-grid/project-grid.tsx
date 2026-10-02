/**
 * 프로젝트 카드 격자(서버 컴포넌트).
 */
import type { Locale } from '@/lib/i18n'
import type { ProjectArchiveCopy } from '@/lib/contents/archive-copy'
import type { ShowcaseProject } from '@/lib/site/project-showcase'
import ProjectCard from './project-card'

/**
 * 프로젝트 격자. 프로젝트가 3개 이상이면 가장 최근 것을 두 칸짜리 카드로 그린다.
 * @param id 목록 요소 id(`FilterBar`의 `scope`)
 */
export default function ProjectGrid({
  id,
  projects,
  lang,
  copy,
}: {
  id: string
  projects: ShowcaseProject[]
  lang: Locale
  copy: ProjectArchiveCopy
}) {
  return (
    <ul id={id} className="release-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          lang={lang}
          copy={copy}
          titleLevel={2}
          featured={index === 0 && projects.length > 2}
        />
      ))}
    </ul>
  )
}
