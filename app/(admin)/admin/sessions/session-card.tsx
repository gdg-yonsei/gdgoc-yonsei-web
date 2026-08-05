import { type AdminSessionListItem } from '@/lib/server/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'
import {
  formatAdminDate,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

export default function SessionCard({
  session,
  locale,
}: {
  session: Pick<AdminSessionListItem, 'id' | 'mainImage' | 'name' | 'startAt'> &
    Partial<Pick<AdminSessionListItem, 'partName'>>
  locale: Locale
}) {
  const t = getAdminMessages(locale)
  return (
    <Link
      href={localizeAdminHref(`/admin/sessions/${session.id}`, locale)}
      className={
        'border-hairline bg-surface hover:border-primary/40 hover:shadow-soft flex flex-col overflow-hidden rounded-lg border transition-all'
      }
    >
      <Image
        src={session.mainImage}
        alt={'Main Image'}
        width={600}
        height={400}
        className={'aspect-3/2 w-full object-cover'}
        placeholder={'blur'}
        blurDataURL={'/default-image.png'}
      />
      <div className={'flex h-full flex-col items-start gap-2 p-3'}>
        <div className={'flex min-w-0 flex-col gap-1'}>
          <div className={'type-title text-ink'}>{session.name}</div>
          {session.partName && (
            <span className={'admin-badge-primary w-fit'}>
              {session.partName}
            </span>
          )}
        </div>
        <div className={'type-caption text-ink-muted mt-auto'}>
          {session.startAt
            ? formatAdminDate(session.startAt, locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : t.tbd}
        </div>
      </div>
    </Link>
  )
}
