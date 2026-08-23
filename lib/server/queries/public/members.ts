import 'server-only'

import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  forEachPublicLocale,
  memberGenerationTag,
  memberListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, eq } from 'drizzle-orm'

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
            orderBy: asc(usersToParts.userId),
          },
        },
        orderBy: asc(parts.displayOrder),
      },
    },
  })
}

const getMembersByGenerationForRequest = cache((generationName: string) =>
  getSharedMembersByGeneration(generationName)
)

export function getMembersByGeneration(
  generationName: string,
  _locale: Locale
) {
  void _locale
  return getMembersByGenerationForRequest(generationName)
}
