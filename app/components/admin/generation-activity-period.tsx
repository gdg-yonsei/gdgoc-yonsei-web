import { formatAdminDate, getAdminLocale } from '@/lib/admin-i18n/server'
import { type Locale } from '@/i18n-config'

/**
 * Generation Activity Period Component
 * @param startDate
 * @param endDate
 * @param className
 * @param locale
 * @constructor
 */
export default async function GenerationActivityPeriod({
  startDate,
  endDate,
  className,
  locale,
}: {
  startDate: string
  endDate: string | null | undefined
  className?: string
  locale?: Locale
}) {
  const resolvedLocale = locale ?? (await getAdminLocale())
  return (
    <div className={className ? className : 'flex items-center gap-2 text-sm'}>
      <div>
        {formatAdminDate(startDate, resolvedLocale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
      <div>-</div>
      <div>
        {endDate
          ? formatAdminDate(endDate, resolvedLocale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : ''}
      </div>
    </div>
  )
}
