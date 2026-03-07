import 'server-only'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import type { Locale } from '@/i18n-config'
import { cacheQuery, memberGenerationTag, memberListTag } from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, eq } from 'drizzle-orm'

export async function getMembersByGeneration(
  generationName: string,
  locale: Locale
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.memberDirectory, [
    memberListTag(locale),
    memberGenerationTag(generationName, locale),
  ])

  return db.query.generations.findFirst({
    where: eq(generations.name, generationName),
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true,
            },
            orderBy: asc(usersToParts.userId),
          },
        },
        orderBy: asc(parts.displayOrder),
      },
    },
  })
}
