import { Dispatch, SetStateAction } from 'react'
import { motion } from 'motion/react'
import { ModalType } from '@/types/modal'

/**
 * `ActivityCard` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function ActivityCard({
  title,
  content,
  className,
  modal,
  setModal,
}: {
  title: string
  content: { en: string; ko: string }
  className?: string
  modal: ModalType
  setModal: Dispatch<SetStateAction<ModalType>>
}) {
  const isThisCardOpen = modal && modal.title === title

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={'h-full w-full snap-center'}
    >
      <motion.div
        layoutId={`activity-card-${title}`}
        className={`flex aspect-4/5 h-full w-64 cursor-pointer items-center justify-center rounded-xl p-4 transition-opacity ${className}`}
        onClick={() => setModal({ title, content })}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: isThisCardOpen ? 0 : 1,
          borderRadius: 12,
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { type: 'spring', stiffness: 300, damping: 30 },
          borderRadius: { duration: 0.3 },
        }}
        style={{ borderRadius: 12 }}
      >
        <motion.h3
          layoutId={`activity-title-${title}`}
          className={
            'text-center text-3xl font-semibold break-words text-white'
          }
        >
          {title}
        </motion.h3>
      </motion.div>
    </motion.div>
  )
}
