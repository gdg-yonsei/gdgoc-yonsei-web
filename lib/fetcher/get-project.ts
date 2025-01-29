import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'

export const preload = (projectId: string) => {
  void getProject(projectId)
}

/**
 * Get Part Data
 * @param projectId - part id
 */
export const getProject = unstable_cache(
  async (projectId: string) => {
    console.log(new Date(), 'Fetch Project Data', projectId)
    return (
      await db.query.projects.findMany({
        where: eq(projects.id, projectId),
        with: {
          usersToProjects: {
            with: {
              user: true,
            },
          },
        },
      })
    )[0]
  },
  [],
  {
    tags: ['projects'],
  }
)
