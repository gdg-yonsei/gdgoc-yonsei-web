import 'server-only'
import db from '@/db'
import cacheTag from '@/lib/server/cacheTag'

export const preload = () => {
  void getProjects()
}

export async function getProjects() {
  'use cache'
  cacheTag('projects', 'generations')
  return db.query.projects.findMany({
    with: {
      generation: true,
    },
  })
}
