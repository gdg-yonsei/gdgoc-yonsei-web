'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/admin/atoms'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 열린 드로어가 별도 닫기 버튼으로 앱 바를 덮으므로, 이 버튼은 항상 열기만 한다. */
export default function ToggleMenubarButton() {
  const [, setIsOpen] = useAtom(menuBarState)
  const { t } = useAdminI18n()

  return (
    <button
      type={'button'}
      onClick={() => setIsOpen(true)}
      aria-label={t('openMenu')}
      className={
        'text-ink-secondary hover:bg-canvas hover:text-ink focus-visible:outline-primary inline-flex size-11 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
      }
    >
      <Bars3Icon className={'size-6'} aria-hidden={'true'} />
    </button>
  )
}
