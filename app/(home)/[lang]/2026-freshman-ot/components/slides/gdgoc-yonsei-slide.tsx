import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import GDGLogo from '@/app/components/svg/gdg-logo'
import { getLocalizedText } from '../utils'
import { GoogleDots } from '../decorative'
import { stagger, fadeUp, scaleIn } from '../variants'

export default function GDGoCYonseiSlide({ lang }: { lang: Locale }) {
  const values = [
    {
      title: 'Community',
      description: {
        ko: '다양한 배경의 개발자들이 모여 교류하고 함께 성장하는 커뮤니티를 만들어갑니다.',
        en: 'Building a community where developers from diverse backgrounds connect, share, and grow together.',
      },
      borderColor: 'border-gdg-red-300',
      bg: 'bg-gdg-red-100/50',
      dot: 'bg-gdg-red-300',
    },
    {
      title: 'Technology',
      description: {
        ko: 'Google의 최신 기술을 학습하고 실제 프로젝트에 적용하며 기술적 역량을 키웁니다.',
        en: 'Learning cutting-edge Google technologies and applying them to real-world projects to build technical expertise.',
      },
      borderColor: 'border-gdg-green-300',
      bg: 'bg-gdg-green-100/50',
      dot: 'bg-gdg-green-300',
    },
    {
      title: 'Growth',
      description: {
        ko: '지속 가능한 성장을 추구하며, 함께 발전하는 개발 문화를 만들어갑니다.',
        en: 'Fostering a culture of sustainable growth where we advance together as developers.',
      },
      borderColor: 'border-gdg-blue-300',
      bg: 'bg-gdg-blue-100/50',
      dot: 'bg-gdg-blue-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex min-h-full w-full items-center justify-center overflow-hidden py-16 md:py-8">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-4 px-5 md:gap-14 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-4 md:gap-6"
        >
          <GDGLogo className="w-16 md:w-24" svgKey="ot-yonsei" />
          <div>
            <h2 className="text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
              GDGoC Yonsei
            </h2>
            <p className="text-logo-blue text-lg md:text-xl">
              Google Developer Group on Campus
            </p>
          </div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-center text-sm text-neutral-600 md:text-xl"
        >
          {getLocalizedText(lang, {
            ko: '연세대학교에서 활동하는 Google Developer Group on Campus입니다.',
            en: 'The Google Developer Group on Campus chapter at Yonsei University.',
          })}
        </motion.p>

        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
          {values.map((v, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className={`rounded-2xl border-2 ${v.borderColor} ${v.bg} p-4 md:p-8`}
            >
              <motion.div
                className={`mb-2 h-3 w-3 rounded-full ${v.dot} md:mb-4`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.8 + i * 0.15,
                  type: 'spring',
                  stiffness: 300,
                }}
              />
              <h3 className="mb-2 text-base font-bold text-neutral-800 md:mb-3 md:text-2xl">
                {v.title}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600 md:text-lg">
                {getLocalizedText(lang, v.description)}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
