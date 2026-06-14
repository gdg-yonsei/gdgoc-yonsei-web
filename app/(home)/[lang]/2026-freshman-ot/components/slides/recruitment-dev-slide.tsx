import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { GoogleDots, ColorBar } from '../decorative'
import { stagger, fadeUp, scaleIn } from '../variants'

export default function RecruitmentDevSlide({ lang }: { lang: Locale }) {
  const parts = [
    {
      name: 'Front-end',
      description: {
        ko: 'React, Next.js 등 모던 프레임워크를 활용한 웹 애플리케이션 UI 개발',
        en: 'Building web application UIs with modern frameworks like React and Next.js',
      },
      lookingFor: {
        ko: '모던 웹 기술(React, TypeScript)에 대한 깊은 이해와 사용자 경험을 고려한 개발 역량',
        en: 'Deep understanding of modern web technologies (React, TypeScript) with a UX-driven development approach',
      },
      accent: 'bg-gdg-blue-300',
      accentLight: 'bg-gdg-blue-300/10',
      textAccent: 'text-gdg-blue-300',
    },
    {
      name: 'Back-end',
      description: {
        ko: '서버 아키텍처 설계, RESTful API 개발, 데이터베이스 설계 및 최적화',
        en: 'Server architecture design, RESTful API development, and database optimization',
      },
      lookingFor: {
        ko: '서버 아키텍처, API 설계, 데이터베이스에 대한 탄탄한 이해와 확장 가능한 시스템 설계 능력',
        en: 'Solid grasp of server architecture, API design, and databases with ability to design scalable systems',
      },
      accent: 'bg-gdg-green-300',
      accentLight: 'bg-gdg-green-300/10',
      textAccent: 'text-gdg-green-300',
    },
    {
      name: 'ML / AI',
      description: {
        ko: '머신러닝, 딥러닝 모델 개발 및 데이터 파이프라인 구축, LLM 활용',
        en: 'ML/DL model development, data pipeline engineering, and LLM applications',
      },
      lookingFor: {
        ko: 'Python, TensorFlow/PyTorch 등 ML 프레임워크 경험과 문제 해결을 위한 모델링 역량',
        en: 'Experience with Python and ML frameworks (TensorFlow/PyTorch) and strong problem-solving through modeling',
      },
      accent: 'bg-gdg-red-300',
      accentLight: 'bg-gdg-red-300/10',
      textAccent: 'text-gdg-red-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex min-h-full w-full items-center justify-center overflow-hidden py-16 md:py-8">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex w-full max-w-6xl flex-col gap-3 px-5 md:gap-10 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <p className="text-gdg-blue-300 mb-1 text-sm font-semibold tracking-widest uppercase md:text-base">
            We&apos;re looking for
          </p>
          <h2 className="text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            {getLocalizedText(lang, { ko: '모집 파트 소개', en: 'Our Teams' })}
          </h2>
          <ColorBar color="bg-gdg-green-300" />
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-3 md:gap-5">
          {parts.map((p, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm md:p-6"
            >
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${p.accent}`}
              />
              <div className="flex flex-col gap-3">
                <h3
                  className={`text-base font-bold ${p.textAccent} md:text-2xl`}
                >
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  {getLocalizedText(lang, p.description)}
                </p>
                <div className={`rounded-xl ${p.accentLight} p-2 md:p-3`}>
                  <p className="text-xs font-semibold text-neutral-500 md:text-sm">
                    Ideal Candidate
                  </p>
                  <p className="mt-1 text-sm leading-snug text-neutral-700 md:text-base">
                    {getLocalizedText(lang, p.lookingFor)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
