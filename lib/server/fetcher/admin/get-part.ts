import 'server-only'
import { cache } from 'react'
import db from '@/db'
import { desc, eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'

export const getPart = cache(async (partId: number) => {
  // 라우트 파라미터가 숫자가 아니면 Postgres 에서 500 — 대신 notFound 시키기 위해 undefined 반환.
  if (!Number.isInteger(partId)) {
    return undefined
  }

  return db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      generation: true,
      usersToParts: {
        with: {
          user: true, // Include the full user object for each member
        },
      },
    },
    orderBy: desc(parts.createdAt),
  })
})
