import type { Locale } from '@/i18n-config'
import type { ProjectArchiveCopy } from '@/lib/contents/archive-copy'
import type { ShowcaseProject } from '@/lib/site/project-showcase'
import ProjectCard from './project-card'

/** The newest release gets a double-width card once there are enough. */
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
