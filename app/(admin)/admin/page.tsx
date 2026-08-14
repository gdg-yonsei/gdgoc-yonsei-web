import { Suspense } from 'react'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import DashboardStats, {
  DashboardStatsSkeleton,
} from '@/app/(admin)/admin/dashboard-stats'
import UpcomingSessions from '@/app/(admin)/admin/sessions/upcoming-sessions'
import { AdminCardSkeleton } from '@/app/components/admin/skeleton'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema/users'
import db from '@/db'
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
import handlePermission from '@/lib/server/permission/handle-permission'

const CALENDAR_ICS_URL =
  'https://calendar.google.com/calendar/ical/677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com/public/basic.ics'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default async function AdminPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  // 사용자의 이름 정보가 업데이트 되어 있는지 확인
  const userInfo = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      firstName: true,
      lastName: true,
    },
  })
  // 만약 사용자 이름 정보가 없다면 프로필 수정 페이지로 리다이렉트
  if (!userInfo?.firstName || !userInfo?.lastName) {
    redirect(localizeAdminHref('/admin/profile/edit', locale))
  }

  const [resolvedScope, canCreateSession, canApproveMember] = await Promise.all(
    [
      resolveAdminGenerationScope(session.user.id),
      handlePermission(session.user.id, 'post', 'sessions'),
      handlePermission(session.user.id, 'put', 'members'),
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
        <DashboardStats scope={scope} locale={locale} t={t} />
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
              <Link
                className={'admin-btn-secondary flex-1'}
                href={
                  'https://calendar.google.com/calendar/u/0?cid=Njc3NjI4ZDUyODM0Mjk5NjViZTE3MmMxMzVmZjBjNjc4MzA3OTVlNWFkZmIzYmMxMTc4MmIzMDVkMTRiMzkyY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t'
                }
                target={'_blank'}
                rel={'noreferrer noopener'}
              >
                {t.googleCalendar}
              </Link>
              <Link
                className={'admin-btn-secondary flex-1'}
                href={
                  'webcal://calendar.google.com/calendar/ical/677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com/public/basic.ics'
                }
              >
                {t.appleCalendar}
              </Link>
            </div>
            <div className={'flex flex-col gap-1.5'}>
              <p className={'admin-field-label'}>{t.calendarUrl}</p>
              <code
                className={
                  'bg-surface-sunken text-ink-muted type-caption rounded-md p-2 break-all'
                }
              >
                {CALENDAR_ICS_URL}
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
        </div>
      </section>
    </AdminDefaultLayout>
  )
}
