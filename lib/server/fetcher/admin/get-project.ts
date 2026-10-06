// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import { isUuid } from '@/lib/server/queries/public/uuid'

/** 프로젝트 하나를 읽는다. UUID 형식이 아니면 `undefined`(404로 이어진다). */
export const getProject = cache(async (projectId: string) => {
  if (!isUuid(projectId)) {
    return undefined
  }

  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      usersToProjects: {
        with: {
          user: true,
        },
      },
      projectsToTags: {
        with: {
          tag: true,
        },
      },
      generation: true,
    },
  })
})
