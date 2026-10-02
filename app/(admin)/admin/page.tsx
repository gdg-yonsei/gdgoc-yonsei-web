/**
 * 관리자 홈(`/admin`) 페이지.
 */
import { Suspense } from 'react'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import McpInstallGuide from '@/app/components/admin/mcp-install-guide'
import { getMcpResourceUrl } from '@/lib/mcp/config'
import DashboardStats, {
  DashboardStatsSkeleton,
} from '@/app/(admin)/admin/dashboard-stats'
import UpcomingSessions from '@/app/(admin)/admin/sessions/upcoming-sessions'
import { AdminCardSkeleton } from '@/app/components/admin/skeleton'
import Link from 'next/link'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { GOOGLE_CALENDAR } from '@/lib/site/channels'
import { getAuthSession } from '@/auth'
import { redirect } from 'next/navigation'
import {
  PlusCircleIcon,
  UserPlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { hasPermission } from '@/lib/server/permission/has-permission'

/**
 * 관리자 홈(대시보드): 통계 타일, 다가오는 세션, 도구(QR 생성, 캘린더 구독, MCP 연결 안내).
 *
 * 범위가 특정 기수일 때만 "세션 만들기" 버튼을 보인다(세션은 기수에 속해야 하므로).
 */
export default async function AdminPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  // 사이드바 사용자 카드도 같은 인자로 getMember를 부르므로(React cache) 조회는 한 번만 일어난다.
  const userInfo = await getMember(session.user.id)

  // 이름을 아직 입력하지 않은 신규 멤버는 프로필 입력부터 하게 한다.
  if (!userInfo?.firstName || !userInfo?.lastName) {
    redirect(localizeAdminHref('/admin/profile/edit', locale))
  }

  const [resolvedScope, canCreateSession, canApproveMember] = await Promise.all(
    [
      resolveAdminGenerationScope(session.user.id),
      hasPermission(session.user.id, 'post', 'sessions'),
      hasPermission(session.user.id, 'put', 'members'),
    ]
  )
  const scope = resolvedScope?.scope ?? null
  const scopeLabel =
    scope?.kind === 'generation'
      ? (resolvedScope?.selectedGeneration?.name ?? null)
      : t.allGenerations

  return (
    <AdminDefaultLayout className={'gap-6'}>
      <AdminPageHeader
        title={t.dashboard}
        description={`${userInfo.firstName} ${userInfo.lastName}`.trim()}
        meta={
          scopeLabel ? (
            <span className={'admin-badge-primary'}>{scopeLabel}</span>
          ) : null
        }
        actions={
          <>
            {canCreateSession && scope?.kind === 'generation' && (
              <Link
                href={localizeAdminHref('/admin/sessions/create', locale)}
                className={'admin-btn-primary'}
              >
                <PlusCircleIcon className={'size-5'} aria-hidden={'true'} />
                {t.session}
              </Link>
            )}
            {canApproveMember && (
              <Link
                href={localizeAdminHref('/admin/members/accept', locale)}
                className={'admin-btn-secondary'}
              >
                <UserPlusIcon className={'size-5'} aria-hidden={'true'} />
                {t.approveMember}
              </Link>
            )}
          </>
        }
      />

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats
          scope={scope}
          locale={locale}
          t={t}
          showPendingApprovals={canApproveMember}
        />
      </Suspense>

      <Suspense fallback={<AdminCardSkeleton />}>
        <UpcomingSessions />
      </Suspense>

      <section className={'border-hairline flex flex-col gap-3 border-t pt-6'}>
        <h2 className={'type-heading-3 text-ink'}>{t.tools}</h2>
        <div className={'grid grid-cols-1 gap-4 lg:grid-cols-2'}>
          <QRCodeGenerator />

          <div className={'admin-card flex flex-col gap-3'}>
            <h3 className={'type-title text-ink flex items-center gap-2'}>
              <CalendarDaysIcon
                className={'text-ink-muted size-5'}
                aria-hidden={'true'}
              />
              {t.subscribeToCalendar}
            </h3>
            <div className={'flex flex-col gap-2 sm:flex-row'}>
              <a
                className={'admin-btn-secondary flex-1'}
                href={GOOGLE_CALENDAR.googleSubscribe}
                target={'_blank'}
                rel={'noreferrer noopener'}
              >
                {t.googleCalendar}
              </a>
              <a
                className={'admin-btn-secondary flex-1'}
                href={GOOGLE_CALENDAR.webcal}
              >
                {t.appleCalendar}
              </a>
            </div>
            <div className={'flex flex-col gap-1.5'}>
              <p className={'admin-field-label'}>{t.calendarUrl}</p>
              <code
                className={
                  'bg-surface-sunken text-ink-muted type-caption rounded-md p-2 break-all'
                }
              >
                {GOOGLE_CALENDAR.ics}
              </code>
              <ol
                className={
                  'type-caption text-ink-muted list-decimal space-y-0.5 pt-1 pl-4'
                }
              >
                <li>{t.copyCalendarAddress}</li>
                <li>{t.pasteAddressToSubscribe}</li>
              </ol>
            </div>
          </div>

          <McpInstallGuide mcpUrl={getMcpResourceUrl()} />
        </div>
      </section>
    </AdminDefaultLayout>
  )
}
