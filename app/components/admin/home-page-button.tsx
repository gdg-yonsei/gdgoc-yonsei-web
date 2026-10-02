'use client'

/**
 * 관리자 화면에서 공개 홈페이지로 가는 링크(클라이언트 컴포넌트).
 */
import Link from 'next/link'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Locale } from '@/lib/i18n'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 공개 사이트 홈(`/{locale}`) 링크.
 *
 * @param locale 이동할 공개 사이트 언어
 */
export default function HomePageButton({ locale = 'en' }: { locale?: Locale }) {
  const { t } = useAdminI18n()

  return (
    <Link
      className={'admin-btn-secondary type-eyebrow min-h-9 flex-1 px-3'}
      href={`/${locale}`}
    >
      <ArrowTopRightOnSquareIcon className={'size-4'} aria-hidden={'true'} />
      {t('home')}
    </Link>
  )
}
