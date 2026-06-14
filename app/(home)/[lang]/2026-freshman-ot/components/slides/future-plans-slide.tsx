import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { FloatingCircle, GoogleDotsLight, ColorBar } from '../decorative'
import { stagger, fadeUp, fadeInLeft } from '../variants'

export default function FuturePlansSlide({ lang }: { lang: Locale }) {
  return (
    <div className="bg-gdg-black relative flex min-h-full w-full items-center justify-center overflow-hidden py-16 md:py-8">
      <FloatingCircle
        color="bg-gdg-blue-300/10"
        size={400}
        left="70%"
        top="-10%"
        delay={0}
      />
      <FloatingCircle
        color="bg-gdg-red-300/8"
        size={350}
        left="-5%"
        top="60%"
        delay={1}
      />
      <FloatingCircle
        color="bg-gdg-green-300/6"
        size={300}
        left="50%"
        top="70%"
        delay={2}
      />

      <GoogleDotsLight />

      <motion.div
        className="relative z-10 flex w-full max-w-4xl flex-col gap-4 px-5 md:gap-14 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <h2 className="text-2xl font-bold text-white md:text-5xl lg:text-6xl">
            {getLocalizedText(lang, { ko: '향후 계획', en: "What's Ahead" })}
          </h2>
          <ColorBar color="bg-gdg-yellow-300" />
        </motion.div>

        {/* The Bridge Hackathon */}
        <motion.div
          variants={fadeInLeft}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                className="bg-gdg-blue-300 h-5 w-5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.6,
                  type: 'spring',
                  stiffness: 300,
                }}
              />
              <motion.div
                className="mt-2 w-0.5 bg-white/20"
                initial={{ height: 0 }}
                animate={{ height: 64 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-white md:text-3xl">
                  2026 The Bridge Hackathon
                </h3>
                <span className="bg-gdg-blue-300/20 text-gdg-blue-200 rounded-full px-3 py-1 text-sm font-medium">
                  {getLocalizedText(lang, { ko: '5월 예정', en: 'May 2026' })}
                </span>
              </div>
              <p className="text-sm text-neutral-300 md:text-xl">
                {getLocalizedText(lang, {
                  ko: '한국 서울에서 개최되는 한일 대학생 개발자 연합 해커톤',
                  en: 'A Korea-Japan joint hackathon for university developers, hosted in Seoul',
                })}
              </p>
              <p className="text-xs text-neutral-500 md:text-base">
                {getLocalizedText(lang, {
                  ko: '연세대학교 · 고려대학교 · 와세다대학교 · 도쿄대학교 4개 대학이 함께 혁신적인 솔루션을 만들어내는 국제 해커톤',
                  en: 'An international hackathon uniting Yonsei, Korea, Waseda, and University of Tokyo to build innovative solutions together',
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Core Member & Member Recruitment */}
        <motion.div
          variants={fadeInLeft}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                className="bg-gdg-green-300 h-5 w-5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.9,
                  type: 'spring',
                  stiffness: 300,
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-white md:text-3xl">
                  {getLocalizedText(lang, {
                    ko: '26-27 Core Member & Member 선발',
                    en: '26-27 Core Member & Member Recruitment',
                  })}
                </h3>
                <span className="bg-gdg-green-300/20 text-gdg-green-200 rounded-full px-3 py-1 text-sm font-medium">
                  {getLocalizedText(lang, {
                    ko: '2학기 전 예정',
                    en: 'Before Fall 2026',
                  })}
                </span>
              </div>
              <p className="text-sm text-neutral-300 md:text-xl">
                {getLocalizedText(lang, {
                  ko: '2026 2학기 전, 26-27 Core Member 및 Member 선발 예정',
                  en: 'Recruiting 26-27 Core Members and Members before Fall 2026',
                })}
              </p>
              <p className="text-xs text-neutral-500 md:text-base">
                {getLocalizedText(lang, {
                  ko: '함께 GDGoC Yonsei를 이끌어갈 열정적인 멤버를 찾고 있습니다',
                  en: 'Looking for passionate members to help lead GDGoC Yonsei',
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
