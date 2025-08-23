import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import cacheTag from '@/lib/server/cacheTag'

export const preload = (projectId: string) => {
  void getProject(projectId)
}

export async function getProject(projectId: string) {
  'use cache'
  cacheTag('projects', 'members', 'generations')

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
