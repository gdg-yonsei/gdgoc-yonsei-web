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

  const rows = await db
    .select({
      id: projects.id,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      generationName: generations.name,
    })
    .from(projects)
    .innerJoin(generations, eq(projects.generationId, generations.id))

  return rows.map((project) => ({
    id: project.id,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    generation: {
      name: project.generationName,
    },
  }))
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
    columns: {
      id: true,
      name: true,
    },
    with: {
      projects: {
        columns: {
          id: true,
          name: true,
          nameKo: true,
          description: true,
          descriptionKo: true,
          mainImage: true,
          createdAt: true,
          updatedAt: true,
        },
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
      generation: {
        columns: {
          id: true,
          name: true,
        },
      },
      usersToProjects: {
        columns: {
          userId: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              firstName: true,
              firstNameKo: true,
              lastName: true,
              lastNameKo: true,
              isForeigner: true,
            },
          },
        },
      },
    },
  })
}
