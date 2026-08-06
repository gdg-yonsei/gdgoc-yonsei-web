'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { setAdminThemeAction } from '@/app/components/admin/theme-actions'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminTheme } from '@/lib/admin-theme'
import { cn } from '@/lib/cn'

/**
 * 라이트/다크 테마 토글.
 *
 * 낙관적으로 `<html>`의 `.dark`를 즉시 토글해 반응을 체감시키고, 서버 액션으로
 * 쿠키를 저장한 뒤 `router.refresh()`로 서버 렌더 결과와 동기화합니다.
 */
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
    // `.dark`는 `<html>`이 아니라 관리자 서브트리 래퍼에 있습니다
    // (`app/(admin)/admin/layout.tsx` 참고).
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
      aria-label={label}
      title={label}
      className={cn(
        'text-ink-secondary hover:bg-canvas hover:text-ink inline-flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors',
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
