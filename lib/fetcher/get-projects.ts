import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'

export const preload = () => {
  void getProjects()
}

/**
 * Get Parts Data
 */
export const getProjects = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Projects Data')
    return db.query.projects.findMany()
  },
  [],
  {
    tags: ['projects'],
  }
)
