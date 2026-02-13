'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'motion/react'

/**
 * `ShowMoreContent` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`children`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function ShowMoreContent({ children }: { children: ReactNode }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <button
        type={'button'}
        onClick={() => setShowMore(true)}
        className={`${showMore ? 'hidden' : ''} ml-auto cursor-pointer text-base text-neutral-600 underline md:hidden`}
      >
        Show More
      </button>
      <motion.p
        initial={{ height: 0, opacity: 0, y: 20 }}
        animate={{
          height: showMore ? 'auto' : 0,
          opacity: showMore ? 1 : 0,
          y: showMore ? 0 : 20,
        }}
        exit={{ height: 0, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {children}
      </motion.p>
      <div className={'not-md:hidden'}>{children}</div>
    </>
  )
}
