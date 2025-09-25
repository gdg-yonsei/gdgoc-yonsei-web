'use client'

import ActivityCard from '@/app/components/home/activity-card'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useRef } from 'react'
import { Locale } from '@/i18n-config'
import activitySectionContents from '@/lib/contents/activity-section'

export type ModalType =
  | false
  | { title: string; content: { en: string; ko: string } }

export default function ActivitiesList({ lang }: { lang: Locale }) {
  const [modal, setModal] = useState<ModalType>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  /**
   * 활동 카드를 좌우로 스크롤 할 수 있게 하는 함수
   * @param direction - 스크롤 방향
   */
  const scrollToCard = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const cardWidth = 272 // w-64 (256px) + gap-8 (32px)
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth

    // scrollLeft 직접 조작으로 확실하게 스크롤
    const currentScroll = container.scrollLeft
    const newScroll = currentScroll + scrollAmount

    // 부드러운 스크롤 애니메이션
    container.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={scrollContainerRef}
        className={'no-scrollbar w-screen snap-x overflow-x-auto scroll-smooth'}
      >
        <div
          className={'flex w-max gap-8 py-8'}
          style={{
            paddingLeft: 'calc(50vw - 100px)',
            paddingRight: 'calc(50vw - 100px)',
          }}
        >
          <AnimatePresence mode="wait">
            {modal && (
              <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setModal(false)
                  }
                }}
              >
                <motion.div
                  layoutId={`activity-card-${modal.title}`}
                  animate={{ borderRadius: 16 }}
                  exit={{ borderRadius: 12 }}
                  transition={{
                    layout: {
                      type: 'spring',
                      damping: 30,
                      stiffness: 300,
                    },
                    borderRadius: { duration: 0.3 },
                  }}
                  className={`relative flex max-h-11/12 min-h-1/2 w-full max-w-2xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-2xl`}
                  style={{ borderRadius: 16 }}
                >
                  {/* 닫기 버튼 */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setModal(false)}
                    className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                    aria-label="Close modal"
                  >
                    <svg
                      className="h-6 w-6 text-gray-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </motion.button>

                  <motion.h3
                    layoutId={`activity-title-${modal.title}`}
                    className={'text-3xl font-bold text-gray-900 md:text-4xl'}
                  >
                    {modal.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      delay: modal ? 0.1 : 0,
                      duration: 0.2,
                    }}
                    className={
                      'overflow-y-auto text-lg leading-relaxed text-gray-700 md:text-xl'
                    }
                  >
                    {modal.content[lang as keyof typeof modal.content] ??
                      modal.content.en}
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {activitySectionContents.map((activity) => (
            <ActivityCard
              key={activity.key}
              modal={modal}
              setModal={setModal}
              title={activity.title}
              content={activity.content}
              className={activity.className}
            />
          ))}
        </div>
      </div>

      {/* 좌우 스크롤 버튼 - 가로 스크롤 구역 아래 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4"
      >
        <motion.button
          onClick={() => scrollToCard('left')}
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Previous card"
        >
          <svg
            className="h-6 w-6 text-gray-700 transition-colors group-hover:text-gray-900"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </motion.button>

        <motion.button
          onClick={() => scrollToCard('right')}
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Next card"
        >
          <svg
            className="h-6 w-6 text-gray-700 transition-colors group-hover:text-gray-900"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </motion.button>
      </motion.div>
    </div>
  )
}
