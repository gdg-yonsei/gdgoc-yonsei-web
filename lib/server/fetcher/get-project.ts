import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = (projectId: string) => {
  void getProject(projectId)
}

export async function getProject(projectId: string) {
  'use cache'
  cacheTagT('projects')

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      usersToProjects: {
        with: {
          user: true,
        },
      },
    },
  })
}
