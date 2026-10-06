// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

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
