import { unstable_cache } from 'next/cache'
import db from '@/db'

export const preload = () => {
  void getProjects()
}

export const getProjects = unstable_cache(
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
