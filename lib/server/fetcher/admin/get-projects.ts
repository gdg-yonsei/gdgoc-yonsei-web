/**
 * 관리자 프로젝트 목록 조회.
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 프로젝트 목록의 한 행. */
export type AdminProjectListItem = {
  id: string
  name: string
  nameKo: string | null
  mainImage: string
  createdAt: Date
  updatedAt: Date
  generationId: number
  generationName: string | null
}

/** 범위의 프로젝트를 기수 이름과 함께 읽는다. 요청 단위로 메모이즈한다. */
export const getProjects = cache(
  async (scope?: AdminGenerationScope | null) => {
    const projectList = await db.query.projects.findMany({
      where:
        scope?.kind === 'generation'
          ? (project, { eq }) => eq(project.generationId, scope.generationId)
          : undefined,
      with: {
        generation: true,
      },
      orderBy: (project, { desc }) => [desc(project.updatedAt)],
    })

    return projectList.map<AdminProjectListItem>((project) => ({
      id: project.id,
      name: project.name,
      nameKo: project.nameKo,
      mainImage: project.mainImage,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      generationId: project.generationId,
      generationName: project.generation?.name ?? null,
    }))
  }
)
