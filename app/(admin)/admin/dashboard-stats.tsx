/**
 * 관리자 대시보드 통계 타일 묶음(서버 컴포넌트). 숫자는 현재 기수 범위 기준으로 SQL `count()`로 센다.
 */
import {
  BookOpenIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import AdminStatTile from '@/app/components/admin/stat-tile'
import { getAdminStats } from '@/lib/server/fetcher/admin/get-admin-stats'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { localizeAdminHref, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'

/**
 * 멤버·세션·프로젝트·파트 수 타일과, 승인 권한이 있으면 가입 대기 수 타일.
 *
 * @param scope 현재 기수 범위(null이면 전체)
 * @param showPendingApprovals 가입 대기 타일을 보일지(멤버 승인 권한)
 */
export default async function DashboardStats({
  scope,
  locale,
  t,
  showPendingApprovals = false,
}: {
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
  showPendingApprovals?: boolean
}) {
  const stats = await getAdminStats(scope)

  const tiles = [
    {
      key: 'members',
      label: t.totalMembers,
      value: stats.members,
      href: localizeAdminHref('/admin/members', locale),
      icon: UsersIcon,
    },
    {
      key: 'sessions',
      label: t.totalSessions,
      value: stats.sessions,
      href: localizeAdminHref('/admin/sessions', locale),
      icon: BookOpenIcon,
    },
    {
      key: 'projects',
      label: t.totalProjects,
      value: stats.projects,
      href: localizeAdminHref('/admin/projects', locale),
      icon: DocumentTextIcon,
    },
    {
      key: 'parts',
      label: t.totalParts,
      value: stats.parts,
      href: localizeAdminHref('/admin/parts', locale),
      icon: CodeBracketIcon,
    },
  ]

  // 승인 권한이 있는 관리자에게만 대기 중인 가입 요청 수를 보여 준다.
  if (showPendingApprovals) {
    tiles.push({
      key: 'pendingApprovals',
      label: t.pendingApprovals,
      value: stats.pendingApprovals,
      href: localizeAdminHref('/admin/members/accept', locale),
      icon: UserPlusIcon,
    })
  }

  return (
    <div className={'grid grid-cols-2 gap-3 lg:grid-cols-5'}>
      {tiles.map((tile) => (
        <AdminStatTile
          key={tile.key}
          label={tile.label}
          value={tile.value}
          href={tile.href}
          icon={tile.icon}
        />
      ))}
    </div>
  )
}

/** 통계 타일 로딩 스켈레톤(타일 5개 자리). */
export function DashboardStatsSkeleton() {
  return (
    <div
      className={'grid grid-cols-2 gap-3 lg:grid-cols-5'}
      aria-hidden={'true'}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={
            'border-hairline bg-surface flex flex-col gap-2 rounded-lg border p-4'
          }
        >
          <div className={'bg-surface-sunken h-3 w-16 animate-pulse rounded'} />
          <div className={'bg-surface-sunken h-9 w-12 animate-pulse rounded'} />
        </div>
      ))}
    </div>
  )
}
