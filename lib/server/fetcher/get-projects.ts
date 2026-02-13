import 'server-only'
import db from '@/db'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadProjects = () => {
  void getProjects()
}

export async function getProjects() {
  'use cache'
  applyCacheTags('projects', 'generations')

  return db.query.projects.findMany({
    with: {
      generation: true,
    },
  })
}
