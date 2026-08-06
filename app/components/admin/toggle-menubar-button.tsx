'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/atoms'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 모바일 앱 바의 드로어 토글 버튼.
 *
 * 드로어가 열리면 드로어 자신이 닫기 버튼을 갖고 배경을 덮으므로, 이 버튼은
 * 항상 '열기' 의미만 갖습니다(아이콘도 바뀌지 않습니다).
 */
export default function ToggleMenubarButton() {
  const [, setIsOpen] = useAtom(menuBarState)
  const { t } = useAdminI18n()

  return (
    <button
      type={'button'}
      onClick={() => setIsOpen(true)}
      aria-label={t('openMenu')}
      className={
        'text-ink-secondary hover:bg-canvas hover:text-ink focus-visible:outline-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
      }
    >
      <Bars3Icon className={'size-6'} aria-hidden={'true'} />
    </button>
  )
}
