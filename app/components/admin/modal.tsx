'use client'

import { useAtom } from 'jotai'
import { modalState } from '@/lib/atoms'
import { motion } from 'motion/react'

/**
 * `Modal` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function Modal() {
  const [modal, setModal] = useAtom(modalState)

  /**
   * `closeModal` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
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
