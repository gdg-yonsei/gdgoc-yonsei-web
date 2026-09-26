import 'server-only'
import { cache } from 'react'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import { isUuid } from '@/lib/server/queries/public/uuid'

export const getProject = cache(async (projectId: string) => {
  if (!isUuid(projectId)) {
    return undefined
  }

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      usersToProjects: {
        with: {
          user: true,
        },
      },
      projectsToTags: {
        with: {
          tag: true,
        },
      },
      generation: true,
    },
  })
})
