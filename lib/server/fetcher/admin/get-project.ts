import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'

export async function getProject(projectId: string) {
  return db.query.projects.findFirst({
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
}
