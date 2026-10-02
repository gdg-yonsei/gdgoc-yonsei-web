'use client'

/**
 * 관리자 모바일 메뉴 드로어(클라이언트 컴포넌트). 열림 상태는 `menuBarState` atom으로 앱 바 버튼·하단 탭과 공유한다.
 */
import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/admin/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useDialogFocus } from '@/lib/hooks/use-dialog-focus'

/**
 * 모바일 내비게이션 드로어.
 *
 * 왼쪽에서 밀려 들어오는 modal dialog로, ESC·포커스 가두기·배경 스크롤 잠금을 갖춘다.
 * `modal.tsx`와 같은 감속 곡선과 `prefers-reduced-motion` 대응을 쓴다.
 *
 * `children`으로 서버에서 렌더링한 사이드바 본문을 받아, 데스크톱 사이드바와 같은
 * 마크업을 그대로 재사용한다.
 * @param children 드로어에 넣을 사이드바 본문
 */
export default function MenuBar({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useAtom(menuBarState)
  const { t } = useAdminI18n()
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  // 열릴 때 배경 스크롤을 잠그고, 닫을 때 되돌린다.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  useDialogFocus({ isOpen, panelRef, onClose: () => setIsOpen(false) })

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
