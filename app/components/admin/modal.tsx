'use client'

import { useAtom } from 'jotai'
import { modalState } from '@/lib/atoms'
import { motion } from 'motion/react'

export default function Modal() {
  const [modal, setModal] = useAtom(modalState)

  function closeModal() {
    setModal({ text: '', action: () => {} })
  }

  return (
    <>
      {modal.text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={
            'fixed top-0 left-0 z-30 flex h-screen w-screen items-center justify-center bg-neutral-500/50 p-4'
          }
        >
          <div
            className={
              'flex h-full max-h-1/2 w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-xl bg-white p-4'
            }
          >
            <div className={'pb-12 text-center text-xl font-bold md:text-2xl'}>
              {modal.text}
            </div>
            <div className={'flex w-full items-center justify-around gap-2'}>
              <button
                type={'button'}
                onClick={modal.action}
                className={
                  'w-full rounded-xl bg-green-600 p-2 px-4 text-white transition-colors hover:bg-green-700'
                }
              >
                Confirm
              </button>
              <button
                type={'button'}
                onClick={closeModal}
                className={
                  'w-full rounded-xl bg-red-600 p-2 px-4 font-semibold text-white transition-colors hover:bg-red-700'
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
