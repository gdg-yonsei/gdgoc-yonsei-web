import db from '@/db'
import { eq, lte } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { sessions } from '@/db/schema/sessions'
import cacheTag from '@/lib/server/cacheTag'

export default async function getSessionList(generationName: string) {
  'use cache'
  cacheTag('sessions', 'generations')

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, generationName),
    with: {
      parts: {
        with: {
          sessions: {
            where: lte(sessions.endAt, new Date()),
          },
        },
      },
    },
  })

  return generationData?.parts
    .map((part) => part.sessions)
    .flatMap((session) => session)
}
