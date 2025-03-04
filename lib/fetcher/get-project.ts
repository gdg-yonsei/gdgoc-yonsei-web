import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'

export const preload = (projectId: string) => {
  void getProject(projectId)
}

export const getProject = unstable_cache(
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
