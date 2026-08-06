'use client'

import Link from 'next/link'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Locale } from '@/i18n-config'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

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
