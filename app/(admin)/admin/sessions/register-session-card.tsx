import Link from 'next/link'
import {
  formatAdminDate,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

export default function RegisterSessionCard({
  sessionId,
  sessionName,
  part,
  startAt,
  endAt,
  maxCapacity,
  participants,
  locale,
}: {
  sessionId: string
  sessionName: string
  part: string
  startAt: Date | null
  endAt: Date | null
  maxCapacity: number | null
  participants: number
  locale: Locale
}) {
  const t = getAdminMessages(locale)
  return (
    <Link
      href={localizeAdminHref(`/admin/sessions/${sessionId}/register`, locale)}
      className={
        'border-hairline bg-surface hover:border-primary/40 hover:shadow-soft flex flex-col gap-3 rounded-lg border p-4 transition-all'
      }
    >
      <div className={'flex items-start justify-between gap-2'}>
        <h3 className={'type-title text-ink min-w-0'}>{sessionName}</h3>
        <span className={'admin-badge-primary shrink-0'}>{part}</span>
      </div>
      <div className={'flex items-end justify-between gap-2'}>
        <div className={'type-caption text-ink-muted'}>
          <p>
            {t.start}:{' '}
            {startAt
              ? formatAdminDate(startAt, locale, {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : t.tbd}
          </p>
          <p className={''}>
            {t.end}:{' '}
            {endAt
              ? formatAdminDate(endAt, locale, {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : t.tbd}
          </p>
        </div>

        <span className={'admin-badge-neutral shrink-0'}>
          {participants} / {maxCapacity ?? '∞'}
        </span>
      </div>
    </Link>
  )
}
