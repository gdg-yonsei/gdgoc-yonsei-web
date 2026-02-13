import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadAdminProjectById = (projectId: string) => {
  void getProject(projectId)
}

export async function getProject(projectId: string) {
  'use cache'
  applyCacheTags('projects', 'members', 'generations')

  console.log(new Date(), 'Fetch Project Data', projectId)
  const result = await db.query.projects.findMany({
    where: eq(projects.id, projectId),
    with: {
      usersToProjects: {
        with: {
          user: true,
        },
      },
      generation: true,
    },
  })
  return result[0]
}
