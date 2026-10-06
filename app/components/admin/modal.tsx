'use client'

/** 레이아웃에 한 번 렌더링하고, modalState에 문구·확인 동작을 넣어 어디서든 연다. */
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { modalState } from '@/lib/admin/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useDialogFocus } from '@/lib/hooks/use-dialog-focus'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 문구가 비어 있으면 닫힌 상태다. */
export default function Modal() {
  const [modal, setModal] = useAtom(modalState)
  const { t } = useAdminI18n()
  const shouldReduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // 모션을 줄이는 사용자에게는 확대/축소 없이 페이드만 남긴다.
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

  // 파괴적 동작은 기본 포커스를 취소에 두어 Enter 한 번에 실행되지 않게 한다.

  useDialogFocus({
    isOpen,
    panelRef,
    onClose: closeModal,
    initialFocusRef: cancelRef,
  })

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
            'fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4'
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
