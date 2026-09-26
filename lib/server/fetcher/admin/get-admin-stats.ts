import 'server-only'
import { eq } from 'drizzle-orm'
import db from '@/db'
import { users } from '@/db/schema/users'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import { getProjects } from '@/lib/server/fetcher/admin/get-projects'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { sessionWallClockNow } from '@/lib/site/datetime'

export type AdminStats = {
  members: number
  sessions: number
  projects: number
  parts: number
  upcomingSessions: number
  pendingApprovals: number
}

/**
 * 대시보드 통계.
 *
 * 목록 페이지가 이미 쓰는 fetcher를 그대로 재사용합니다. 이 fetcher들은 요청
 * 단위로 메모이즈되므로 같은 요청 안에서 목록과 통계가 쿼리를 공유합니다.
 * 별도의 count 쿼리를 새로 만들면 스코프 필터 로직이 이중으로 갈라집니다.
 */
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
