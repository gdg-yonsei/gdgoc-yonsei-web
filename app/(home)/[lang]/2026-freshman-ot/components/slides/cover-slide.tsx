import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import GDGLogo from '@/app/components/svg/gdg-logo'
import { getLocalizedText } from '../utils'
import { FloatingCircle } from '../decorative'
import { stagger, scaleIn, fadeUp } from '../variants'

export default function CoverSlide({ lang }: { lang: Locale }) {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-white py-16 md:py-8">
      <FloatingCircle
        color="bg-gdg-blue-300/15"
        size={500}
        left="-8%"
        top="-15%"
        delay={0}
      />
      <FloatingCircle
        color="bg-gdg-red-300/12"
        size={380}
        left="72%"
        top="55%"
        delay={1}
      />
      <FloatingCircle
        color="bg-gdg-green-300/10"
        size={420}
        left="65%"
        top="-20%"
        delay={2}
      />
      <FloatingCircle
        color="bg-gdg-yellow-300/10"
        size={300}
        left="-5%"
        top="60%"
        delay={0.5}
      />
      <FloatingCircle
        color="bg-gdg-blue-200/8"
        size={220}
        left="40%"
        top="72%"
        delay={1.5}
      />

      <motion.div
        className="relative z-10 flex w-full flex-col items-center gap-4 px-4 md:gap-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={scaleIn}>
          <GDGLogo className="w-40 md:w-56 lg:w-72" svgKey="ot-cover" />
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-2 md:gap-3"
        >
          <h1 className="text-center text-3xl font-semibold tracking-tight text-neutral-800 md:text-5xl lg:text-6xl">
            Google Developer Group
          </h1>
          <p className="text-logo-blue text-xl font-light md:text-3xl lg:text-4xl">
            on Campus
          </p>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-logo-blue text-lg font-medium md:text-2xl lg:text-3xl"
        >
          Yonsei University
        </motion.p>

        <motion.div variants={fadeUp} className="mt-2 md:mt-4">
          <p className="rounded-full bg-neutral-100 px-4 py-2 text-xs text-neutral-500 md:px-8 md:py-3 md:text-lg">
            {getLocalizedText(lang, {
              ko: '2026 첨단컴퓨팅학부 신입생 OT',
              en: '2026 School of Advanced Computing Freshman Orientation',
            })}
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
