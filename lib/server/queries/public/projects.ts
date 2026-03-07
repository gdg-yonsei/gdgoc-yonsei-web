import 'server-only'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { projects } from '@/db/schema/projects'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  projectGenerationTag,
  projectListTag,
  projectTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { desc, eq } from 'drizzle-orm'

export async function getProjects(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.projectList, [projectListTag(locale)])

  return db.query.projects.findMany({
    with: {
      generation: true,
    },
  })
}

export async function getProjectsByGeneration(
  generationName: string,
  locale: Locale
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.projectList, [
    projectListTag(locale),
    projectGenerationTag(generationName, locale),
  ])

  return db.query.generations.findFirst({
    where: eq(generations.name, generationName),
    with: {
      projects: {
        orderBy: desc(projects.updatedAt),
      },
    },
  })
}

export async function getProjectById(projectId: string, locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.projectDetail, [projectTag(projectId, locale)])

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      generation: true,
      usersToProjects: {
        with: {
          user: true,
        },
      },
    },
  })
}
