/**
 * 기수 활동 기간("시작일 - 종료일") 표시(서버 컴포넌트).
 */
import { formatAdminDate, getAdminLocale } from '@/lib/admin-i18n/server'
import { type Locale } from '@/lib/i18n'

/**
 * 관리자 언어 형식으로 기수 활동 기간을 보여 준다. 종료일이 없으면 비워 둔다.
 *
 * @param startDate `YYYY-MM-DD` 시작일
 * @param endDate `YYYY-MM-DD` 종료일
 * @param locale 생략하면 관리자 언어 쿠키에서 읽는다
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
          // 'YYYY-MM-DD' 날짜는 UTC 자정으로 파싱된다.
          timeZone: 'UTC',
        })}
      </div>
      <div>-</div>
      <div>
        {endDate
          ? formatAdminDate(endDate, resolvedLocale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
            })
          : ''}
      </div>
    </div>
  )
}
