import 'server-only'

import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { projects } from '@/db/schema/projects'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  forEachPublicLocale,
  projectGenerationTag,
  projectListTag,
  projectTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { desc, eq } from 'drizzle-orm'

async function getSharedProjects() {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [projectListTag(locale)])
  )

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

const getProjectsForRequest = cache(() => getSharedProjects())

export function getProjects(_locale: Locale) {
  void _locale
  return getProjectsForRequest()
}

const getProjectsByGenerationForRequest = cache((generationName: string) =>
  getSharedProjectsByGeneration(generationName)
)

async function getSharedProjectsByGeneration(generationName: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [
      projectListTag(locale),
      projectGenerationTag(generationName, locale),
    ])
  )

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

export function getProjectsByGeneration(
  generationName: string,
  _locale: Locale
) {
  void _locale
  return getProjectsByGenerationForRequest(generationName)
}

const getProjectByIdForRequest = cache((projectId: string) =>
  getSharedProjectById(projectId)
)

async function getSharedProjectById(projectId: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectDetail,
    forEachPublicLocale((locale) => [projectTag(projectId, locale)])
  )

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      name: true,
      nameKo: true,
      description: true,
      descriptionKo: true,
      content: true,
      contentKo: true,
      mainImage: true,
      images: true,
      createdAt: true,
      updatedAt: true,
    },
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

export function getProjectById(projectId: string, _locale: Locale) {
  void _locale
  if (!isUuid(projectId)) {
    return Promise.resolve(undefined)
  }

  return getProjectByIdForRequest(projectId)
}
