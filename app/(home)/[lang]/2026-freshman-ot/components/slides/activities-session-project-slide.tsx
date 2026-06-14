import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { GoogleDots, ColorBar, ActivityBullet } from '../decorative'
import { stagger, fadeUp, fadeInLeft, fadeInRight } from '../variants'

export default function ActivitiesSessionProjectSlide({ lang }: { lang: Locale }) {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-white py-16 md:py-8">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex w-full max-w-5xl flex-col gap-4 px-5 md:gap-10 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <h2 className="text-2xl font-bold text-neutral-800 md:text-5xl lg:text-6xl">
            {getLocalizedText(lang, { ko: '주요 활동', en: 'Key Activities' })}
          </h2>
          <div className="flex">
            <ColorBar color="bg-gdg-red-300" />
          </div>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
          {/* Session */}
          <motion.div
            variants={fadeInLeft}
            className="relative overflow-hidden rounded-2xl bg-neutral-50 p-4 shadow-sm md:p-7"
          >
            <div className="bg-gdg-blue-300 absolute top-0 left-0 h-full w-1.5" />
            <div className="flex flex-col gap-3 pl-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-neutral-800 md:text-2xl">
                  Session
                </h3>
                <span className="bg-gdg-blue-100 text-gdg-blue-300 rounded-full px-3 py-0.5 text-sm font-semibold">
                  {getLocalizedText(lang, {
                    ko: '기술 세션',
                    en: 'Tech Sessions',
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ActivityBullet
                  label="T19 —"
                  text={getLocalizedText(lang, {
                    ko: '매주 화요일 7시에 진행하는 테크 세션으로 관심 있는 기술에 대한 발제를 진행합니다.',
                    en: 'Weekly Tuesday tech talks where speakers present and share their latest tech interests with all members.',
                  })}
                  color="bg-gdg-blue-300"
                />
                <ActivityBullet
                  label="Part Session —"
                  text={getLocalizedText(lang, {
                    ko: '파트별로 스터디 또는 논문 리뷰를 진행합니다.',
                    en: 'Weekly part-specific sessions for in-depth tech studies and paper reviews.',
                  })}
                  color="bg-gdg-blue-200"
                />
              </div>
            </div>
          </motion.div>

          {/* Project */}
          <motion.div
            variants={fadeInRight}
            className="relative overflow-hidden rounded-2xl bg-neutral-50 p-4 shadow-sm md:p-7"
          >
            <div className="bg-gdg-red-300 absolute top-0 left-0 h-full w-1.5" />
            <div className="flex flex-col gap-3 pl-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-neutral-800 md:text-2xl">
                  Project
                </h3>
                <span className="bg-gdg-red-100 text-gdg-red-300 rounded-full px-3 py-0.5 text-sm font-semibold">
                  {getLocalizedText(lang, {
                    ko: '팀 프로젝트',
                    en: 'Team Projects',
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ActivityBullet
                  label="oTP (open Tech Project) —"
                  text={getLocalizedText(lang, {
                    ko: '여러 파트의 멤버들과 팀을 이루어 서비스 개발, 연말 연고대 합동 Demo Day에서 발표',
                    en: 'Cross-part teams build real services, showcased at the year-end joint Yonsei-Korea Univ. Demo Day.',
                  })}
                  color="bg-gdg-red-300"
                />
                <ActivityBullet
                  label="PLP (Production Level Project) —"
                  text={getLocalizedText(lang, {
                    ko: '실제 배포 수준의 서비스를 개발·출시하는 겨울 방학 집중 프로젝트',
                    en: 'Intensive winter program to develop and ship production-grade services.',
                  })}
                  color="bg-gdg-red-200"
                />
                <ActivityBullet
                  label="Solution Challenge —"
                  text={getLocalizedText(lang, {
                    ko: 'Google 주최 국제대회, 사회 문제 해결 솔루션 개발',
                    en: "Google's international competition for social impact solutions — top results 3 years running.",
                  })}
                  color="bg-gdg-red-100"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
