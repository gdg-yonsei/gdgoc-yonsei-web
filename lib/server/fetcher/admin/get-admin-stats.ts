// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import { getProjects } from '@/lib/server/fetcher/admin/get-projects'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { sessionWallClockNow } from '@/lib/format/datetime'

export type AdminStats = {
  members: number
  sessions: number
  projects: number
  parts: number
  upcomingSessions: number
  pendingApprovals: number
}

// 목록 fetcher를 재사용해 요청 내 쿼리와 스코프 규칙을 공유한다. 별도 count는 필터 로직을 중복시킨다.
export async function getAdminStats(
  scope: AdminGenerationScope | null
): Promise<AdminStats> {
  const [members, sessions, projects, parts, pendingApprovals] =
    await Promise.all([
      getMembers(scope),
      getSessions(scope),
      getProjects(scope),
      getParts(scope),
      db.$count(users, eq(users.role, 'UNVERIFIED')),
    ])

  // startAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  const now = sessionWallClockNow().getTime()
  const upcomingSessions = sessions.filter(
    (session) => session.startAt && new Date(session.startAt).getTime() >= now
  ).length

  return {
    members: members.length,
    sessions: sessions.length,
    projects: projects.length,
    parts: parts.length,
    upcomingSessions,
    pendingApprovals,
  }
}
