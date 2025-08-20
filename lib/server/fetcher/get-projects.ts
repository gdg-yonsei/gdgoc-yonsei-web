import 'server-only'
import db from '@/db'
import { dbCache } from '@/lib/server/fetcher/db-cache'

export const preload = () => {
  void getProjects()
}

export const getProjects = dbCache(
  async () =>
    db.query.projects.findMany({
      with: {
        generation: true,
      },
    }),
  [],
  {
    tags: ['projects'],
  }
)
