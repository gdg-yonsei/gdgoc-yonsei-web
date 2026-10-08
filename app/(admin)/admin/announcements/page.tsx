import Link from 'next/link'
import type { Metadata } from 'next'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import AdminEmptyState from '@/app/components/admin/empty-state'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import { getAuthSession } from '@/auth'
import { getAnnouncements } from '@/lib/server/fetcher/admin/get-announcements'
import {
  formatAdminDate,
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { fillTemplate } from '@/lib/format/text'

export const metadata: Metadata = {
  title: 'Announcements',
}

export default async function AnnouncementsPage() {
  const [locale, session, announcements] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
    getAnnouncements(),
  ])
  const t = getAdminMessages(locale)
  const createHref = localizeAdminHref('/admin/announcements/create', locale)

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.announcements}
        description={t.announcementsDescription}
        actions={
          <Link href={createHref} className={'admin-btn-primary'}>
            <PlusCircleIcon className={'size-5'} aria-hidden={'true'} />
            {t.newAnnouncement}
          </Link>
        }
      />

      {announcements.length === 0 ? (
        <AdminEmptyState
          title={t.announcementsEmpty}
          description={t.announcementsEmptyHint}
        />
      ) : (
        <ul className={'flex flex-col gap-3'} aria-label={t.announcements}>
          {announcements.map((announcement) => (
            <li
              key={announcement.id}
              className={
                'admin-card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
              }
            >
              <div className={'flex min-w-0 flex-col gap-1'}>
                <h2 className={'type-title text-ink break-words'}>
                  {announcement.title}
                </h2>
                <p
                  className={
                    'type-body-sm text-ink-muted line-clamp-3 whitespace-pre-line'
                  }
                >
                  {announcement.body}
                </p>
                <p className={'type-caption text-ink-faint'}>
                  {[
                    formatAdminDate(announcement.createdAt, locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'Asia/Seoul',
                    }),
                    fillTemplate(t.announcementReadCount, {
                      count: announcement.readCount,
                    }),
                    announcement.ctaHref,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className={'shrink-0'}>
                <DataDeleteButton
                  session={session}
                  dataType={'announcements'}
                  dataId={announcement.id}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminDefaultLayout>
  )
}
