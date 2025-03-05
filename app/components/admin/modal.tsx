'use client'

import { useAtom } from 'jotai'
import { modalState } from '@/lib/atoms'

export default function Modal() {
  const [modal, setModal] = useAtom(modalState)

  function closeModal() {
    setModal({ text: '', action: () => {} })
  }

  return (
    <>
      {modal.text && (
        <div
          className={
            'fixed top-0 left-0 w-screen h-screen bg-neutral-500/50 p-4 z-30 flex justify-center items-center'
          }
        >
          <div
            className={
              'p-4 bg-white rounded-xl flex flex-col gap-2 w-full max-w-2xl h-full max-h-1/2 items-center justify-center'
            }
          >
            <div className={'text-xl md:text-2xl font-bold pb-12 text-center'}>
              {modal.text}
            </div>
            <div className={'flex items-center gap-2 justify-around w-full'}>
              <button
                type={'button'}
                onClick={modal.action}
                className={
                  'p-2 px-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors w-full'
                }
              >
                Confirm
              </button>
              <button
                type={'button'}
                onClick={closeModal}
                className={
                  'p-2 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors w-full'
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
