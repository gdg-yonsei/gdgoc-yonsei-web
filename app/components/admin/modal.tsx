'use client'

import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { modalState } from '@/lib/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export default function Modal() {
  const [modal, setModal] = useAtom(modalState)
  const { t } = useAdminI18n()
  const shouldReduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  // 모션을 줄이는 사용자에게는 확대/축소 없이 페이드만 남깁니다.
  const panelMotion = shouldReduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.97 },
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
      }

  function closeModal() {
    setModal({ text: '', action: () => {} })
  }

  const isOpen = Boolean(modal.text)

  // ESC 닫기 · 포커스 트랩 · 열기 전 포커스 복귀.
  // 확인 모달은 파괴적 동작(삭제)을 감싸므로 키보드만으로도 안전하게 취소할 수
  // 있어야 합니다.
  useEffect(() => {
    if (!isOpen) {
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
      return
    }

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    // 파괴적 확인이 기본 포커스를 가져가지 않도록 취소 버튼에 먼저 포커스합니다.
    cancelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
        return
      }
      if (event.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={'admin-modal'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeModal}
          className={
            'fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
          }
        >
          <motion.div
            {...panelMotion}
            ref={panelRef}
            role={'dialog'}
            aria-modal={'true'}
            aria-labelledby={'admin-modal-title'}
            onClick={(event) => event.stopPropagation()}
            className={
              'bg-surface shadow-elevated flex w-full max-w-md flex-col gap-6 rounded-xl p-6'
            }
          >
            <p
              id={'admin-modal-title'}
              className={'type-heading-3 text-ink text-center text-balance'}
            >
              {modal.text}
            </p>
            <div className={'flex flex-col-reverse gap-2 sm:flex-row'}>
              <button
                ref={cancelRef}
                type={'button'}
                onClick={closeModal}
                className={'admin-btn-secondary flex-1'}
              >
                {t('cancel')}
              </button>
              <button
                type={'button'}
                onClick={modal.action}
                className={'admin-btn-danger flex-1'}
              >
                {t('confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
