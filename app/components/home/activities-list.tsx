'use client'

import ActivityCard from '@/app/components/home/activity-card'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useRef } from 'react'

export default function ActivitiesList() {
  const [modalOpen, setModalOpen] = useState<
    false | { title: string; content: string }
  >(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const activities = [
    {
      key: 'T19',
      title: 'T19',
      content:
        'T19, short for "Tech at 19:00", is an internal tech-sharing conference held every Tuesday at 7 PM, with participation from all GDG Yonsei members. Each week, 3 presenters share their technical knowledge or experiences.',
      className: 'bg-gdg-red-300 ring-gdg-red-300 flex-shrink-0',
    },
    {
      key: 'Part Session',
      title: 'Part Session',
      content:
        'GDG Yonsei is divided into six specialized departments—Front-End, Back-End, ML/AI, UI/UX, and Developer Relations—each consisting of a small, select group. These departments conduct studies and workshops to develop advanced technical skills.',
      className: 'bg-gdg-green-300 ring-gdg-green-300 flex-shrink-0',
    },
    {
      key: 'Solution Challenge',
      title: 'Solution Challenge',
      content:
        "We participated in the 2023 Solution Challenge, an annual international student development competition organized by Google for Developers. We designed and built a product aimed at contributing to the achievement of the UN's Sustainable Development Goals (SDGs). GDG Yonsei achieved the highest award rate among university chapters in South Korea. - 2,100 teams participated from university GDGs worldwide - Six teams from GDG Yonsei participated - Three teams making it to the Top 100 - One team being selected as a Top 10 Finalist This achievement highlights our group's strong technical capabilities and social impact.",
      className: 'bg-gdg-yellow-300 ring-gdg-yellow-300 flex-shrink-0',
    },
    {
      key: 'oTP',
      title: 'oTP',
      content:
        'GDG Yonsei is divided into six specialized departments—Front-End, Back-End, ML/AI, UI/UX, and Developer Relations—each consisting of a small, select group. These departments conduct studies and workshops to develop advanced technical skills.',
      className: 'bg-gdg-blue-300 ring-gdg-blue-300 flex-shrink-0',
    },
    {
      key: 'Yonsei X Korea Demo Day',
      title: 'Yonsei X Korea Demo Day',
      content:
        'GDG Yonsei is divided into six specialized departments—Front-End, Back-End, ML/AI, UI/UX, and Developer Relations—each consisting of a small, select group. These departments conduct studies and workshops to develop advanced technical skills.',
      className: 'bg-gdg-red-300 ring-gdg-red-300 flex-shrink-0',
    },
    {
      key: 'The Bridge Hackathon',
      title: 'The Bridge Hackathon',
      content:
        'GDG Yonsei is divided into six specialized departments—Front-End, Back-End, ML/AI, UI/UX, and Developer Relations—each consisting of a small, select group. These departments conduct studies and workshops to develop advanced technical skills.',
      className: 'bg-gdg-green-300 ring-gdg-green-300 flex-shrink-0',
    },
  ]

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
            {modalOpen && (
              <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setModalOpen(false)
                  }
                }}
              >
                <motion.div
                  layoutId={`activity-card-${modalOpen.title}`}
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
                    onClick={() => setModalOpen(false)}
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
                    layoutId={`activity-title-${modalOpen.title}`}
                    className={'text-3xl font-bold text-gray-900 md:text-4xl'}
                  >
                    {modalOpen.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      delay: modalOpen ? 0.1 : 0,
                      duration: 0.2,
                    }}
                    className={
                      'overflow-y-auto text-lg leading-relaxed text-gray-700 md:text-xl'
                    }
                  >
                    {modalOpen.content}
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {activities.map((activity) => (
            <ActivityCard
              key={activity.key}
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
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
