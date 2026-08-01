'use client'

import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 모바일 내비게이션 드로어.
 *
 * 이전 구현은 상단 바의 높이를 `h-0 ↔ h-[70vh]`로 늘리는 방식이라 ESC · 포커스
 * 트랩 · 스크롤 락이 전혀 없었고, 열리면 페이지가 아래로 밀려났습니다.
 * 지금은 좌측에서 슬라이드하는 실제 dialog로, `modal.tsx`와 동일한 감속 곡선과
 * `prefers-reduced-motion` 대응을 공유합니다.
 *
 * `children`으로 서버에서 렌더한 사이드바 본문을 그대로 받아, 데스크탑 사이드바와
 * 완전히 같은 마크업을 재사용합니다.
 */
export default function MenuBar({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useAtom(menuBarState)
  const { t } = useAdminI18n()
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  // 열릴 때 배경 스크롤을 잠그고, 닫을 때 되돌립니다.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // ESC로 닫기 + 포커스 트랩 + 닫을 때 트리거로 포커스 복귀
  useEffect(() => {
    if (!isOpen) {
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
      return
    }

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, setIsOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={'fixed inset-0 z-40 lg:hidden'}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
            onClick={() => setIsOpen(false)}
            className={'absolute inset-0 bg-black/40 backdrop-blur-sm'}
          />
          <motion.div
            ref={panelRef}
            role={'dialog'}
            aria-modal={'true'}
            aria-label={t('mainNavigation')}
            initial={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
            transition={
              reduceMotion
                ? { duration: 0.12 }
                : { duration: 0.28, ease: [0.23, 1, 0.32, 1] }
            }
            className={
              'bg-surface absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col shadow-xl'
            }
          >
            <div
              className={
                'border-hairline flex h-14 shrink-0 items-center justify-between border-b pr-2 pl-4'
              }
            >
              <span className={'type-title text-ink'}>{t('menu')}</span>
              <button
                type={'button'}
                onClick={() => setIsOpen(false)}
                aria-label={t('closeMenu')}
                className={
                  'text-ink-secondary hover:bg-canvas hover:text-ink focus-visible:outline-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
                }
              >
                <XMarkIcon className={'size-6'} aria-hidden={'true'} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
