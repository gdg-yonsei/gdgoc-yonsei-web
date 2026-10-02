/**
 * 관리자 프로젝트 상세 조회(참가자, 태그, 기수 포함).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
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
