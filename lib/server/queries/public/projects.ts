// 두 언어 필드를 한 공유 캐시에 담고 기존 무효화 규칙에 맞춰 두 언어 태그를 모두 붙인다.
// React cache는 같은 요청의 중복 호출만 합친다.
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { projects } from '@/db/schema/projects'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  projectGenerationTag,
  projectListTag,
  projectDetailsTag,
  projectTag,
  tagQuery,
  uniqueStrings,
} from '@/lib/server/cache'
import {
  toShowcaseProject,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { desc, eq } from 'drizzle-orm'

async function getSharedProjects() {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [projectListTag(locale)])
  )

  const rows = await db
    .select({
      id: projects.id,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      generationName: generations.name,
    })
    .from(projects)
    .innerJoin(generations, eq(projects.generationId, generations.id))

  return rows.map((project) => ({
    id: project.id,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    generation: {
      name: project.generationName,
    },
  }))
}

const getProjectsForRequest = cache(() => getSharedProjects())

export function getProjects() {
  return getProjectsForRequest()
}

/** 카드와 상세가 함께 읽는 관계(기수, 태그, 참가자). `ProjectRow` 타입과 맞춰야 한다. */
const PROJECT_RELATIONS = {
  generation: { columns: { id: true, name: true, startDate: true } },
  projectsToTags: {
    columns: { tagId: true },
    with: { tag: { columns: { name: true } } },
  },
  usersToProjects: {
    columns: { userId: true },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          firstName: true,
          firstNameKo: true,
          lastName: true,
          lastNameKo: true,
          isForeigner: true,
          image: true,
          githubId: true,
        },
      },
    },
  },
} as const

const PROJECT_CARD_COLUMNS = {
  id: true,
  name: true,
  nameKo: true,
  description: true,
  descriptionKo: true,
  mainImage: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

async function getSharedProjectShowcase(): Promise<ShowcaseProject[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [projectListTag(locale)])
  )

  const rows = await db.query.projects.findMany({
    columns: PROJECT_CARD_COLUMNS,
    with: PROJECT_RELATIONS,
    orderBy: desc(projects.updatedAt),
  })

  // 기수 페이지도 이 항목을 읽으므로 기수 태그도 단다(이유는 sessions.ts 참고).
  const generationNames = uniqueStrings(rows.map((row) => row.generation.name))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => projectGenerationTag(name, locale)),
    ])
  )

  return rows.map(toShowcaseProject)
}

const getProjectShowcaseForRequest = cache(() => getSharedProjectShowcase())

export function getProjectShowcase() {
  return getProjectShowcaseForRequest()
}

const getProjectByIdForRequest = cache((projectId: string) =>
  getSharedProjectById(projectId)
)

async function getSharedProjectById(projectId: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectDetail,
    forEachPublicLocale((locale) => [
      projectTag(projectId, locale),
      projectDetailsTag(locale),
    ])
  )

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      ...PROJECT_CARD_COLUMNS,
      content: true,
      contentKo: true,
      images: true,
    },
    with: PROJECT_RELATIONS,
  })
}

/** 프로젝트 상세(본문·이미지 포함). UUID가 아니면 DB를 조회하지 않고 `undefined`. */
export function getProjectById(projectId: string) {
  if (!isUuid(projectId)) {
    return Promise.resolve(undefined)
  }

  return getProjectByIdForRequest(projectId)
}
