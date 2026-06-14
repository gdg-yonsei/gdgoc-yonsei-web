import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { GoogleDots, ColorBar, ActivityBullet } from '../decorative'
import { stagger, fadeUp, fadeInLeft, fadeInRight } from '../variants'

export default function ActivitiesNetworkingHackathonSlide({ lang }: { lang: Locale }) {
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
          {/* Networking */}
          <motion.div
            variants={fadeInLeft}
            className="relative overflow-hidden rounded-2xl bg-neutral-50 p-4 shadow-sm md:p-7"
          >
            <div className="bg-gdg-green-300 absolute top-0 left-0 h-full w-1.5" />
            <div className="flex flex-col gap-3 pl-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-neutral-800 md:text-2xl">
                  Networking
                </h3>
                <span className="bg-gdg-green-100 text-gdg-green-300 rounded-full px-3 py-0.5 text-sm font-semibold">
                  {getLocalizedText(lang, { ko: '네트워킹', en: 'Networking' })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ActivityBullet
                  label={getLocalizedText(lang, {
                    ko: '연고대 합동 —',
                    en: 'Joint with Korea Univ. —',
                  })}
                  text={getLocalizedText(lang, {
                    ko: 'GDGoC KU와 함께 Demo Day, Networking Party 등 다양한 합동 행사 진행',
                    en: 'Joint events with GDGoC KU including Demo Day and Networking Party.',
                  })}
                  color="bg-gdg-green-300"
                />
                <ActivityBullet
                  label={getLocalizedText(lang, {
                    ko: '타 챕터 교류 —',
                    en: 'Inter-chapter —',
                  })}
                  text={getLocalizedText(lang, {
                    ko: '다른 학교 GDGoC 챕터들과 해커톤 및 다양한 행사를 함께 진행',
                    en: 'Expanding our network through hackathons and events with other university GDGoC chapters.',
                  })}
                  color="bg-gdg-green-200"
                />
              </div>
            </div>
          </motion.div>

          {/* Hackathon */}
          <motion.div
            variants={fadeInRight}
            className="relative overflow-hidden rounded-2xl bg-neutral-50 p-4 shadow-sm md:p-7"
          >
            <div className="bg-gdg-yellow-300 absolute top-0 left-0 h-full w-1.5" />
            <div className="flex flex-col gap-3 pl-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-neutral-800 md:text-2xl">
                  Hackathon
                </h3>
                <span className="bg-gdg-yellow-100 text-gdg-yellow-300 rounded-full px-3 py-0.5 text-sm font-semibold">
                  {getLocalizedText(lang, { ko: '해커톤', en: 'Hackathons' })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ActivityBullet
                  label={getLocalizedText(lang, {
                    ko: 'GDGoC 연합 해커톤 —',
                    en: 'GDGoC Joint Hackathon —',
                  })}
                  text={getLocalizedText(lang, {
                    ko: '여러 학교 GDGoC 챕터들이 모여 함께 진행하는 연합 해커톤',
                    en: 'Multi-university hackathons bringing together GDGoC chapters from across the country.',
                  })}
                  color="bg-gdg-yellow-300"
                />
                <ActivityBullet
                  label="The Bridge Hackathon —"
                  text={getLocalizedText(lang, {
                    ko: '한국·일본 4개 대학(연세대, 고려대, 와세다대, 도쿄대)이 함께하는 국제 해커톤',
                    en: 'International hackathon uniting 4 universities — Yonsei, Korea, Waseda, and U of Tokyo.',
                  })}
                  color="bg-gdg-yellow-200"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
