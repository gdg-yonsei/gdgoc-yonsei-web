import 'server-only'
import db from '@/db'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = () => {
  void getProjects()
}

export async function getProjects() {
  'use cache'
  cacheTagT('projects', 'generations')
  return db.query.projects.findMany({
    with: {
      generation: true,
    },
  })
}
