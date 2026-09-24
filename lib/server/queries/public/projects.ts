import 'server-only'

import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { projects } from '@/db/schema/projects'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  projectGenerationTag,
  projectListTag,
  projectTag,
  tagQuery,
  uniqueStrings,
} from '@/lib/server/cache'
import {
  toShowcaseProject,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'
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

/** Relations both project read models load; matches `ProjectRow`. */
const PROJECT_RELATIONS = {
  generation: { columns: { id: true, name: true, startDate: true } },
  projectsToTags: {
    columns: { tagId: true },
    with: { tag: { columns: { name: true } } },
  },
  usersToProjects: {
    columns: { userId: true },
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
          image: true,
          githubId: true,
        },
      },
    },
  },
} as const

const PROJECT_CARD_COLUMNS = {
  id: true,
  name: true,
  nameKo: true,
  description: true,
  descriptionKo: true,
  mainImage: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

async function getSharedProjectShowcase(): Promise<ShowcaseProject[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.projectList,
    forEachPublicLocale((locale) => [projectListTag(locale)])
  )

  const rows = await db.query.projects.findMany({
    columns: PROJECT_CARD_COLUMNS,
    with: PROJECT_RELATIONS,
    orderBy: desc(projects.updatedAt),
  })

  // Generation pages read this entry too (see sessions.ts for the reason).
  const generationNames = uniqueStrings(rows.map((row) => row.generation.name))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => projectGenerationTag(name, locale)),
    ])
  )

  return rows.map(toShowcaseProject)
}

const getProjectShowcaseForRequest = cache(() => getSharedProjectShowcase())

/** Every project with tags and contributors, for hubs, pages and counters. */
export function getProjectShowcase() {
  return getProjectShowcaseForRequest()
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
      ...PROJECT_CARD_COLUMNS,
      content: true,
      contentKo: true,
      images: true,
    },
    with: PROJECT_RELATIONS,
  })
}

export function getProjectById(projectId: string, _locale: Locale) {
  void _locale
  if (!isUuid(projectId)) {
    return Promise.resolve(undefined)
  }

  return getProjectByIdForRequest(projectId)
}
