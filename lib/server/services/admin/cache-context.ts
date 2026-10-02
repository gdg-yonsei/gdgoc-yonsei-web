/**
 * 캐시 무효화 대상 계산용 조회.
 *
 * 공개 캐시 태그와 경로에는 기수 이름이 들어가므로, 데이터를 바꾸기 전·후에 해당 데이터가
 * 속한 기수 이름을 읽어 무효화 함수에 넘긴다.
 */
import 'server-only'

import { db } from '@/db'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { usersToParts } from '@/db/schema/users-to-parts'
import { eq } from 'drizzle-orm'
import { uniqueStrings } from '@/lib/server/cache/utils'

/** 기수 ID로 기수 이름을 읽는다. */
export async function getGenerationNameById(generationId: number) {
  return db.query.generations.findFirst({
    where: (generation, { eq }) => eq(generation.id, generationId),
    columns: {
      name: true,
    },
  })
}

/** 파트가 속한 기수 이름. */
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

/** 사용자가 소속된 모든 기수 이름(중복 제거). */
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

/** 프로젝트 ID와 그 프로젝트의 기수 이름. */
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

/** 세션 ID와 그 세션(파트)의 기수 이름. */
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
