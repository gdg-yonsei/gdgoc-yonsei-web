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
import { desc, eq, inArray } from 'drizzle-orm'

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

// 기수 페이지 목록 전용 캐시. 반드시 `connection()` 뒤(요청 시점)에서만 읽는다.
// prerender에서 읽힌 캐시 값은 Resume Data Cache에 남고, Next 16.4는 만료된 기수 페이지를
// 이어 그릴 때 이전 요청에서 만료된 태그를 확인하지 않아 빌드 시점 값을 보여 준다.
// prerender에서 한 번도 읽히지 않은 키는 캐시 핸들러가 태그 만료를 확인해 돌려준다.
async function getSharedGenerationProjectShowcase(
  generationName: string
): Promise<ShowcaseProject[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [
      projectListTag(locale),
      projectGenerationTag(generationName, locale),
    ])
  )

  const rows = await db.query.projects.findMany({
    columns: PROJECT_CARD_COLUMNS,
    with: PROJECT_RELATIONS,
    where: inArray(
      projects.generationId,
      db
        .select({ id: generations.id })
        .from(generations)
        .where(eq(generations.name, generationName))
    ),
    orderBy: desc(projects.updatedAt),
  })

  return rows.map(toShowcaseProject)
}

const getGenerationProjectShowcaseForRequest = cache((generationName: string) =>
  getSharedGenerationProjectShowcase(generationName)
)

/** 한 기수의 프로젝트 카드. 기수 목록 페이지가 읽는다. */
export function getGenerationProjectShowcase(generationName: string) {
  return getGenerationProjectShowcaseForRequest(generationName)
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
