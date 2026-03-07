import 'server-only'

import db from '@/db'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { usersToParts } from '@/db/schema/users-to-parts'
import { eq } from 'drizzle-orm'

function uniqueStrings(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.filter(Boolean) as string[])]
}

export async function getGenerationNameById(generationId: number) {
  return db.query.generations.findFirst({
    where: (generation, { eq }) => eq(generation.id, generationId),
    columns: {
      name: true,
    },
  })
}

export async function getGenerationNameForPartId(partId: number) {
  const part = await db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      generation: {
        columns: {
          name: true,
        },
      },
    },
  })

  return part?.generation?.name ?? null
}

export async function getGenerationNamesForUserId(userId: string) {
  const memberships = await db.query.usersToParts.findMany({
    where: eq(usersToParts.userId, userId),
    with: {
      part: {
        with: {
          generation: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })

  return uniqueStrings(
    memberships.map((membership) => membership.part?.generation?.name)
  )
}

export async function getProjectGenerationName(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      generation: {
        columns: {
          name: true,
        },
      },
    },
  })

  return project?.generation?.name ?? null
}

export async function getSessionGenerationName(sessionId: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      part: {
        with: {
          generation: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })

  return session?.part?.generation?.name ?? null
}

export async function getProjectCacheContext(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
    },
    with: {
      generation: {
        columns: {
          name: true,
        },
      },
    },
  })

  return {
    projectId: project?.id ?? projectId,
    generationName: project?.generation?.name ?? null,
  }
}

export async function getSessionCacheContext(sessionId: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: {
      id: true,
    },
    with: {
      part: {
        with: {
          generation: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })

  return {
    sessionId: session?.id ?? sessionId,
    generationName: session?.part?.generation?.name ?? null,
  }
}
