import type { Locale } from '@/i18n-config'
import formatUserName from '@/lib/format-user-name'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'

export type ProjectUserRow = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
  image: string | null
  githubId: string | null
}

/** The shape both project queries return (see PROJECT_RELATIONS). */
export type ProjectRow = {
  id: string
  name: string
  nameKo: string | null
  description: string
  descriptionKo: string | null
  mainImage: string
  repoUrl: string | null
  demoUrl: string | null
  createdAt: Date
  updatedAt: Date
  generation: { name: string; startDate: string }
  projectsToTags: { tag: { name: string } }[]
  usersToProjects: { user: ProjectUserRow }[]
}

export type ShowcaseContributor = {
  id: string
  nameEn: string
  nameKo: string
  image: string | null
  githubId: string | null
}

export type ShowcaseProject = {
  id: string
  name: string
  nameKo: string | null
  description: string
  descriptionKo: string | null
  mainImage: string
  repoUrl: string | null
  demoUrl: string | null
  createdAt: Date
  updatedAt: Date
  generationName: string
  generationStartDate: string
  tags: string[]
  contributors: ShowcaseContributor[]
}

export function toShowcaseProject(row: ProjectRow): ShowcaseProject {
  return {
    id: row.id,
    name: row.name,
    nameKo: row.nameKo,
    description: row.description,
    descriptionKo: row.descriptionKo,
    mainImage: row.mainImage,
    repoUrl: row.repoUrl,
    demoUrl: row.demoUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    generationName: row.generation.name,
    generationStartDate: row.generation.startDate,
    tags: row.projectsToTags
      .map(({ tag }) => tag.name)
      .sort((a, b) => a.localeCompare(b)),
    contributors: row.usersToProjects.map(({ user }) => ({
      id: user.id,
      nameEn: formatUserName(
        user.name,
        user.firstName,
        user.lastName,
        user.isForeigner
      ),
      nameKo: formatUserName(
        user.name,
        user.firstNameKo,
        user.lastNameKo,
        user.isForeigner,
        true
      ),
      image: user.image,
      githubId: user.githubId,
    })),
  }
}

export function projectTitle(
  project: Pick<ShowcaseProject, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return locale === 'ko' ? project.nameKo || project.name : project.name
}

export function projectSummary(
  project: Pick<ShowcaseProject, 'description' | 'descriptionKo'>,
  locale: Locale
): string {
  return locale === 'ko'
    ? project.descriptionKo || project.description
    : project.description
}

export function contributorName(
  contributor: ShowcaseContributor,
  locale: Locale
): string {
  return locale === 'ko' ? contributor.nameKo : contributor.nameEn
}

export function sortShowcase(
  projects: readonly ShowcaseProject[]
): ShowcaseProject[] {
  return [...projects].sort(
    (a, b) =>
      b.generationStartDate.localeCompare(a.generationStartDate) ||
      b.updatedAt.getTime() - a.updatedAt.getTime()
  )
}

export function projectLinkValues(project: ShowcaseProject): string[] {
  return [
    ...(project.demoUrl ? ['demo'] : []),
    ...(project.repoUrl ? ['source'] : []),
  ]
}

export function projectFacets(projects: readonly ShowcaseProject[]): {
  generations: FacetOption[]
  tags: FacetOption[]
  links: { demo: number; source: number }
} {
  const generationCounts = new Map<
    string,
    { startDate: string; count: number }
  >()
  const tagCounts = new Map<string, number>()
  for (const project of projects) {
    const entry = generationCounts.get(project.generationName) ?? {
      startDate: project.generationStartDate,
      count: 0,
    }
    generationCounts.set(project.generationName, {
      ...entry,
      count: entry.count + 1,
    })
    for (const tag of project.tags)
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  return {
    generations: [...generationCounts.entries()]
      .sort(([, a], [, b]) => b.startDate.localeCompare(a.startDate))
      .map(([value, { count }]) => ({ value, label: value, count })),
    tags: [...tagCounts.entries()]
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    links: {
      demo: projects.filter((project) => project.demoUrl).length,
      source: projects.filter((project) => project.repoUrl).length,
    },
  }
}

export function projectSearchText(project: ShowcaseProject): string {
  return normalizeSearchText(
    [
      project.name,
      project.nameKo,
      project.description,
      project.descriptionKo,
      project.generationName,
      ...project.tags,
      ...project.contributors.flatMap((contributor) => [
        contributor.nameEn,
        contributor.nameKo,
      ]),
    ]
      .filter(Boolean)
      .join(' ')
  )
}

/** The project after `id` in the given order, wrapping around. */
export function nextProject(
  projects: readonly ShowcaseProject[],
  id: string
): ShowcaseProject | null {
  const index = projects.findIndex((project) => project.id === id)
  if (index === -1 || projects.length < 2) return null
  return projects[(index + 1) % projects.length] ?? null
}

export function moreFromGeneration(
  projects: readonly ShowcaseProject[],
  current: ShowcaseProject,
  limit = 3
): ShowcaseProject[] {
  return projects
    .filter(
      (project) =>
        project.id !== current.id &&
        project.generationName === current.generationName
    )
    .slice(0, limit)
}
