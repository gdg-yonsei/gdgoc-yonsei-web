import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import {
  cacheQuery,
  forEachPublicLocale,
  memberGenerationTag,
  memberListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, eq, sql } from 'drizzle-orm'

async function getSharedMembersByGeneration(generationName: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.memberDirectory,
    forEachPublicLocale((locale) => [
      memberListTag(locale),
      memberGenerationTag(generationName, locale),
    ])
  )

  return db.query.generations.findFirst({
    where: eq(generations.name, generationName),
    columns: {
      id: true,
      name: true,
    },
    with: {
      parts: {
        columns: {
          id: true,
          name: true,
        },
        with: {
          usersToParts: {
            columns: {
              userId: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  firstName: true,
                  firstNameKo: true,
                  lastName: true,
                  lastNameKo: true,
                  githubId: true,
                  instagramId: true,
                  linkedInId: true,
                  isForeigner: true,
                },
              },
            },
            // Use the role in this part, not the user's global admin role.
            orderBy: [
              asc(sql`case ${usersToParts.userType}
                when 'Core' then 0
                when 'Primary' then 1
                when 'Secondary' then 2
                else 3
              end`),
              asc(usersToParts.userId),
            ],
          },
        },
        orderBy: [asc(parts.displayOrder), asc(parts.id)],
      },
    },
  })
}

const getMembersByGenerationForRequest = cache((generationName: string) =>
  getSharedMembersByGeneration(generationName)
)

export function getMembersByGeneration(generationName: string) {
  return getMembersByGenerationForRequest(generationName)
}
