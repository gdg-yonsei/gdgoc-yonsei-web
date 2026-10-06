'use client'

import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/admin/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useDialogFocus } from '@/lib/hooks/use-dialog-focus'

/** 서버 렌더링한 사이드바 본문을 재사용하며, modal과 같은 감속·움직임 줄이기 대응을 쓴다. */
export default function MenuBar({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useAtom(menuBarState)
  const { t } = useAdminI18n()
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

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
                  'text-ink-secondary hover:bg-canvas hover:text-ink focus-visible:outline-primary inline-flex size-11 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
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
