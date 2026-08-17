import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'

export async function getGeneration(generationId: number) {
  return db.query.generations.findFirst({
    where: eq(generations.id, generationId),
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })
}
