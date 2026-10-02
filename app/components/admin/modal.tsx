'use client'

/**
 * 관리자 전역 확인 모달(클라이언트 컴포넌트).
 *
 * `modalState` atom에 문구와 확인 동작을 넣으면 열린다(삭제 버튼 등). 레이아웃에 한 번만
 * 렌더링해 두고 어디서든 atom으로 띄운다.
 */
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { modalState } from '@/lib/admin/atoms'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'
import { useDialogFocus } from '@/lib/hooks/use-dialog-focus'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 확인/취소 모달. 문구가 비어 있으면 닫힌 상태다. */
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

  // 확인 모달은 파괴적 동작(삭제)을 감싸므로 키보드만으로도 안전하게 취소할 수 있어야 한다.
  // 기본 포커스는 "취소"에 두어 Enter 한 번에 삭제되지 않게 한다.
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
