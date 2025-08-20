import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import { dbCache } from '@/lib/server/fetcher/db-cache'

export const preload = (projectId: string) => {
  void getProject(projectId)
}

export const getProject = dbCache(
  async (projectId: string) =>
    db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        usersToProjects: {
          with: {
            user: true,
          },
        },
      },
    }),
  [],
  { tags: ['projects'] }
)
