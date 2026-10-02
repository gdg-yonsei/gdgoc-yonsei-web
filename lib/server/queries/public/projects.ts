/**
 * 공개 프로젝트 쇼케이스 조회.
 *
 * 공개 사이트 조회는 모두 같은 구조다.
 * - `getShared*`: `'use cache: remote'` 함수. 결과를 Redis(또는 메모리)에 공유 캐시한다.
 *   행에 영어·한국어 필드가 모두 있으므로 언어와 무관하게 캐시 항목 하나를 쓰고, 기존 무효화
 *   규칙을 지키려고 두 언어의 태그를 모두 단다.
 * - `get*ForRequest`: React `cache()`로 같은 요청 안의 중복 호출을 합친다.
 * - 공개 함수(`get*`): 입력 검증(UUID 등) 후 위 함수를 부른다.
 */
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

/** 정적 파라미터용 가벼운 프로젝트 목록(ID·기수 이름). */
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

/** 정적 파라미터 생성용 프로젝트 ID·기수 목록. */
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

/** 프로젝트 카드에 필요한 컬럼(상세 본문 제외). */
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

/** 태그·참가자를 포함한 모든 프로젝트. 허브, 기수 페이지, 개수 표시가 함께 쓴다. */
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
    forEachPublicLocale((locale) => [projectTag(projectId, locale)])
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
