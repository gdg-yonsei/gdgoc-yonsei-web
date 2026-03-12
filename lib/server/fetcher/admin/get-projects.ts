import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import db from '@/db'
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

export const preloadAdminProjects = (scope?: AdminGenerationScope | null) => {
  void getProjects(scope)
}

export async function getProjects(scope?: AdminGenerationScope | null) {
  noStore()

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
