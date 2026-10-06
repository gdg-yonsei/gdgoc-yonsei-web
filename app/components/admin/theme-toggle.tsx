'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { setAdminThemeAction } from '@/app/components/admin/theme-actions'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminTheme } from '@/lib/admin-theme'
import { cn } from '@/lib/cn'

/** 관리자 래퍼의 dark 클래스를 즉시 바꾸고, 쿠키 저장 뒤 router.refresh로 서버 결과와 맞춘다. */
export default function ThemeToggle({
  theme,
  className,
}: {
  theme: AdminTheme
  className?: string
}) {
  const { t } = useAdminI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState<AdminTheme>(theme)

  const next: AdminTheme = current === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? t('darkMode') : t('lightMode')

  function handleToggle() {
    setCurrent(next)

    document
      .getElementById('admin-theme-root')
      ?.classList.toggle('dark', next === 'dark')
    startTransition(async () => {
      await setAdminThemeAction(next)
      router.refresh()
    })
  }

  return (
    <button
      type={'button'}
      onClick={handleToggle}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={label}
      title={label}
      className={cn(
        'text-ink-secondary hover:bg-canvas hover:text-ink inline-flex size-11 cursor-pointer items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
    >
      {current === 'dark' ? (
        <SunIcon className={'size-5'} aria-hidden={'true'} />
      ) : (
        <MoonIcon className={'size-5'} aria-hidden={'true'} />
      )}
    </button>
  )
}
