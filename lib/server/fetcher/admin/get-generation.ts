import 'server-only'
import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'

export const getGeneration = cache(async (generationId: number) => {
  if (!Number.isInteger(generationId)) {
    return undefined
  }

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
})
