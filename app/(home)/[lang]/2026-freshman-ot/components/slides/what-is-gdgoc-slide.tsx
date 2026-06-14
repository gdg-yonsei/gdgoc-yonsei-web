import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { GoogleDots, ColorBar } from '../decorative'
import { stagger, fadeUp, fadeInLeft } from '../variants'

export default function WhatIsGDGoCSlide({ lang }: { lang: Locale }) {
  const points = [
    {
      color: 'bg-gdg-blue-300',
      text: {
        ko: '전 세계 1,900개 이상의 대학에서 운영되는 글로벌 개발자 커뮤니티',
        en: 'A global developer community active across 1,900+ universities worldwide',
      },
    },
    {
      color: 'bg-gdg-red-300',
      text: {
        ko: 'Google의 기술과 리소스를 활용한 실전 중심의 학습 환경',
        en: 'Hands-on learning powered by Google technologies and resources',
      },
    },
    {
      color: 'bg-gdg-green-300',
      text: {
        ko: '다양한 분야의 개발자들과 교류하며 함께 성장하는 기회',
        en: 'Opportunities to connect and grow alongside developers from diverse fields',
      },
    },
    {
      color: 'bg-gdg-yellow-300',
      text: {
        ko: 'Google 공식 지원을 통한 글로벌 네트워킹과 커리어 성장',
        en: 'Global networking and career growth through official Google support',
      },
    },
  ]

  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-white py-16 md:py-8">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex w-full max-w-4xl flex-col gap-4 px-5 md:gap-12 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <h2 className="text-2xl font-bold text-neutral-800 md:text-5xl lg:text-6xl">
            {getLocalizedText(lang, { ko: 'GDGoC란?', en: 'What is GDGoC?' })}
          </h2>
          <ColorBar color="bg-gdg-blue-300" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-sm leading-relaxed text-neutral-600 md:text-2xl"
        >
          {lang === 'ko' ? (
            <>
              <span className="font-semibold text-neutral-800">
                Google Developer Group on Campus
              </span>
              는 <span className="text-logo-blue font-semibold">Google</span>이
              지원하는 전 세계 대학 개발자 커뮤니티입니다.
            </>
          ) : (
            <>
              <span className="font-semibold text-neutral-800">
                Google Developer Group on Campus
              </span>{' '}
              is a global university developer community supported by{' '}
              <span className="text-logo-blue font-semibold">Google</span>.
            </>
          )}
        </motion.p>

        <div className="flex flex-col gap-2 md:gap-5">
          {points.map((point, i) => (
            <motion.div
              key={i}
              variants={fadeInLeft}
              className="flex items-center gap-4 md:gap-5"
            >
              <motion.div
                className={`h-4 w-4 flex-shrink-0 rounded-full ${point.color}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.6 + i * 0.15,
                  type: 'spring',
                  stiffness: 300,
                }}
              />
              <p className="text-sm text-neutral-700 md:text-xl">
                {getLocalizedText(lang, point.text)}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
