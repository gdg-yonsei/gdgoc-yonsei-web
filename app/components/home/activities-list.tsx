'use client'

import ActivityCard from '@/app/components/home/activity-card'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useRef } from 'react'

const activities = [
  {
    key: 'T19',
    title: 'T19',
    content: {
      en: 'T19, short for "Tech at 19:00", is an internal tech-sharing conference held every Tuesday at 7 PM, with participation from all GDG Yonsei members. Each week, 3 presenters share their technical knowledge or experiences.',
      ko: 'T19는 “Tech at 19:00”의 줄임말로, 매주 화요일 저녁 7시에 열리는 GDG Yonsei 내부 기술 공유 컨퍼런스입니다. 모든 GDG Yonsei 멤버들이 참여하며, 매주 3명의 발표자가 자신의 기술 지식이나 경험을 공유합니다.',
    },
    className: 'bg-gdg-red-300 ring-gdg-red-300 flex-shrink-0',
  },
  {
    key: 'Part Session',
    title: 'Part Session',
    content: {
      en: 'GDG Yonsei is divided into six specialized departments—Front-End, Back-End, ML/AI, Cloud, UI/UX, and Developer Relations—each consisting of a small, select group. These departments conduct studies and workshops to develop advanced technical skills.',
      ko: 'GDG Yonsei는 프론트엔드, 백엔드, ML/AI, UI/UX, Developer Relations의 여섯 개 전문 파트로 구성되어 있으며, 각 파트는 소수의 선발된 인원으로 이루어져 있습니다. 이들은 고급 기술 역량 강화를 위해 스터디와 워크숍을 진행합니다.',
    },
    className: 'bg-gdg-green-300 ring-gdg-green-300 flex-shrink-0',
  },
  {
    key: 'Solution Challenge',
    title: 'Solution Challenge',
    content: {
      en: "We participated in the 2023 Solution Challenge, an annual international student development competition organized by Google for Developers. We designed and built a product aimed at contributing to the achievement of the UN's Sustainable Development Goals (SDGs). GDG Yonsei achieved the highest award rate among university chapters in South Korea. - 2,100 teams participated from university GDGs worldwide - Six teams from GDG Yonsei participated - Three teams making it to the Top 100 - One team being selected as a Top 10 Finalist This achievement highlights our group's strong technical capabilities and social impact.",
      ko:
        '우리는 Google for Developers가 주최하는 국제 대학생 개발 대회인 2023 Solution Challenge에 참가했습니다. 이 대회는 UN의 지속가능발전목표(SDGs) 달성에 기여할 수 있는 제품을 설계하고 개발하는 것을 목표로 합니다. GDG Yonsei는 한국 내 대학 챕터 중 가장 높은 수상률을 기록했습니다.\n' +
        '\t•\t전 세계 GDG 대학 챕터에서 총 2,100개 팀이 참가\n' +
        '\t•\tGDG Yonsei에서 6개 팀이 참가\n' +
        '\t•\t이 중 3개 팀이 Top 100에 선정\n' +
        '\t•\t1개 팀은 Top 10 파이널리스트로 선정\n',
    },
    className: 'bg-gdg-yellow-300 ring-gdg-yellow-300 flex-shrink-0',
  },
  {
    key: 'oTP',
    title: 'oTP',
    content: {
      en: 'oTP (Open Tech Project) is a project where teams freely choose a topic and develop a service based on it. The goal is to actively utilize various technologies and solve real-world problems. Ultimately, teams present and share their results at a demo day, fostering growth through the experience.',
      ko: 'oTP(Open Tech Project)는 팀이 자유롭게 주제를 선정하고 이를 바탕으로 서비스를 개발하는 프로젝트입니다. 다양한 기술을 적극적으로 활용하고 실제 문제를 해결하는 것을 목표로 하며, 최종적으로 데모 데이에서 결과물을 발표하고 공유함으로써 경험을 통한 성장을 추구합니다.',
    },
    className: 'bg-gdg-blue-300 ring-gdg-blue-300 flex-shrink-0',
  },
  {
    key: 'Yonsei X Korea Demo Day',
    title: 'Yonsei X Korea Demo Day',
    content: {
      en: 'Yonsei X Korea Demo Day is an event jointly hosted by GDGoC Yonsei and GDGoC Korea, where participants share their experiences and projects. The goal is to broaden perspectives and foster a wide-reaching network through this collaborative exchange.',
      ko: 'Yonsei X Korea Demo Day는 GDGoC Yonsei과 GDGoC Korea가 공동으로 주최하는 행사로, 참가자들이 경험과 프로젝트를 공유하는 자리입니다. 이 협력 교류를 통해 시야를 넓히고 폭넓은 네트워크를 형성하는 것을 목표로 합니다.',
    },
    className: 'bg-gdg-red-300 ring-gdg-red-300 flex-shrink-0',
  },
  {
    key: 'The Bridge Hackathon',
    title: 'The Bridge Hackathon',
    content: {
      en: 'The Bridge Hackathon is a joint Korea-Japan hackathon hosted by the GDGoC chapters of Yonsei University, Korea University, the University of Tokyo, and Waseda University. Starting in 2025, it will be held regularly. The event aims to broaden perspectives through interaction with students from different countries and provide hands-on experience in turning ideas into reality through a hackathon format.',
      ko: 'The Bridge Hackathon은 연세대학교, 고려대학교, 도쿄대학교, 와세다대학교 GDGoC 챕터가 공동으로 주최하는 한일 연합 해커톤입니다. 2025년부터 정기적으로 개최될 예정이며, 다양한 국가의 학생들과 교류하며 시야를 넓히고 해커톤 형식을 통해 아이디어를 현실로 구체화하는 실전 경험을 제공하는 것을 목표로 합니다.',
    },
    className: 'bg-gdg-green-300 ring-gdg-green-300 flex-shrink-0',
  },
]

export default function ActivitiesList({ lang }: { lang: string }) {
  const [modalOpen, setModalOpen] = useState<
    false | { title: string; content: { en: string; ko: string } }
  >(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
                    {modalOpen.content[
                      lang as keyof typeof modalOpen.content
                    ] ?? modalOpen.content.en}
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
