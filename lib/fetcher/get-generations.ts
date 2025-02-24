import { unstable_cache } from 'next/cache'
import db from '@/db'

export const preload = () => {
  void getGenerations()
}

export const getGenerations = unstable_cache(
  async () =>
    db.query.generations.findMany({
      columns: {
        id: false,
      },
    }),
  [],
  { tags: ['generations'] }
)
