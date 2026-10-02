/**
 * 프로젝트 쇼케이스 데이터 가공(순수 함수): 카드 모델, 정렬, 필터, 검색, 관련 프로젝트.
 */
import { type Locale, pickLocalized } from '@/lib/i18n'
import { formatUserName } from '@/lib/format/user-name'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'

/** 프로젝트 참가자 행(쿼리 결과). */
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

/** 두 프로젝트 쿼리가 돌려주는 행 모양(`PROJECT_RELATIONS` 참고). */
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

/** 카드에 보일 참가자(두 언어 이름, 아바타). */
export type ShowcaseContributor = {
  id: string
  nameEn: string
  nameKo: string
  image: string | null
  githubId: string | null
}

/** 프로젝트 카드 모델. */
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

/** 쿼리 행을 카드 모델로 바꾼다. */
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

/** 현재 언어의 프로젝트 이름(없으면 다른 언어). */
export function projectTitle(
  project: Pick<ShowcaseProject, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return pickLocalized(locale, { en: project.name, ko: project.nameKo }) ?? ''
}

/** 현재 언어의 프로젝트 요약(없으면 다른 언어). */
export function projectSummary(
  project: Pick<ShowcaseProject, 'description' | 'descriptionKo'>,
  locale: Locale
): string {
  return (
    pickLocalized(locale, {
      en: project.description,
      ko: project.descriptionKo,
    }) ?? ''
  )
}

/** 현재 언어의 참가자 이름. */
export function contributorName(
  contributor: ShowcaseContributor,
  locale: Locale
): string {
  return locale === 'ko' ? contributor.nameKo : contributor.nameEn
}

/** 최신 기수 → 최근 수정 순으로 정렬한다. */
export function sortShowcase(
  projects: readonly ShowcaseProject[]
): ShowcaseProject[] {
  return [...projects].sort(
    (a, b) =>
      b.generationStartDate.localeCompare(a.generationStartDate) ||
      b.updatedAt.getTime() - a.updatedAt.getTime()
  )
}

/** 링크 필터용 값: 데모(`demo`)·소스(`source`) 링크가 있는지. */
export function projectLinkValues(project: ShowcaseProject): string[] {
  return [
    ...(project.demoUrl ? ['demo'] : []),
    ...(project.repoUrl ? ['source'] : []),
  ]
}

/** 필터 선택지: 기수(최신순), 태그(많은 순), 링크 종류별 개수. */
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

/** 검색 대상 문자열(이름, 설명, 기수, 태그, 참가자). */
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

/** 주어진 순서에서 `id` 다음 프로젝트(마지막이면 처음으로 돌아간다). */
export function nextProject(
  projects: readonly ShowcaseProject[],
  id: string
): ShowcaseProject | null {
  const index = projects.findIndex((project) => project.id === id)
  if (index === -1 || projects.length < 2) return null
  return projects[(index + 1) % projects.length] ?? null
}

/** 같은 기수의 다른 프로젝트(상세 페이지 하단 추천). */
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
