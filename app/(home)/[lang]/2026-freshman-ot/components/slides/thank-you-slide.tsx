import { lazy, Suspense } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Locale } from '@/i18n-config'
import GDGLogo from '@/app/components/svg/gdg-logo'
import { getLocalizedText } from '../utils'
import { FloatingCircle } from '../decorative'
import { stagger, scaleIn, fadeUp } from '../variants'

const QRCode = lazy(() => import('react-qr-code'))

const SITE_URL = 'https://gdgoc.yonsei.ac.kr'

export default function ThankYouSlide({ lang }: { lang: Locale }) {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-white py-16 md:py-8">
      <FloatingCircle
        color="bg-gdg-blue-300/12"
        size={380}
        left="8%"
        top="8%"
        delay={0}
      />
      <FloatingCircle
        color="bg-gdg-red-300/10"
        size={300}
        left="70%"
        top="58%"
        delay={1}
      />
      <FloatingCircle
        color="bg-gdg-green-300/8"
        size={340}
        left="62%"
        top="2%"
        delay={1.5}
      />
      <FloatingCircle
        color="bg-gdg-yellow-300/10"
        size={260}
        left="3%"
        top="62%"
        delay={0.5}
      />

      <motion.div
        className="relative z-10 flex w-full flex-col items-center gap-3 px-4 md:gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={scaleIn}>
          <GDGLogo className="w-16 md:w-32" svgKey="ot-thanks" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="text-2xl font-bold text-neutral-800 md:text-5xl lg:text-6xl"
        >
          {getLocalizedText(lang, { ko: '감사합니다', en: 'Thank You' })}
        </motion.h2>

        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-0.5"
        >
          <p className="text-sm text-neutral-600 md:text-lg">
            Google Developer Group on Campus
          </p>
          <p className="text-logo-blue text-xs font-medium md:text-base">
            Yonsei University
          </p>
        </motion.div>

        {/* Organizer + QR */}
        <motion.div
          variants={fadeUp}
          className="mt-1 flex flex-col items-center gap-4 md:mt-4 md:flex-row md:items-start md:gap-10"
        >
          {/* Organizer Contact */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-neutral-50 px-6 py-4 md:px-16 md:py-9">
            <p className="text-sm font-semibold tracking-widest text-neutral-400 uppercase">
              Organizer
            </p>
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-bold text-neutral-800 md:text-2xl">
                {getLocalizedText(lang, { ko: '전현우', en: 'Hyunwoo Jeon' })}
              </p>
              <p className="text-sm text-neutral-500 md:text-lg">
                GDGoC Yonsei Organizer
              </p>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-xs text-neutral-500 md:text-lg">
              <p>jhyunwoo@yonsei.ac.kr</p>
              <p>@gdg.yonseiuniv</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-neutral-50 px-6 py-4 md:px-12 md:py-9">
            <p className="text-sm font-semibold tracking-widest text-neutral-400 uppercase">
              Homepage
            </p>
            <Suspense
              fallback={
                <div className="h-[120px] w-[120px] animate-pulse rounded-lg bg-neutral-200 md:h-[180px] md:w-[180px]" />
              }
            >
              <QRCode
                value={`${SITE_URL}/${lang}`}
                size={160}
                bgColor="transparent"
                fgColor="#1e1e1e"
                level="M"
                className="h-[120px] w-[120px] md:h-[180px] md:w-[180px]"
              />
            </Suspense>
            <p className="text-sm text-neutral-400">gdgoc.yonsei.ac.kr</p>
          </div>
        </motion.div>

        {/* Homepage Link */}
        <motion.div variants={fadeUp}>
          <Link
            href={`/${lang}`}
            className="text-logo-blue flex items-center gap-2 rounded-full border-2 border-current px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50 md:px-8 md:py-3 md:text-base"
            onClick={(e) => e.stopPropagation()}
          >
            {getLocalizedText(lang, {
              ko: 'GDGoC Yonsei 홈페이지 방문하기 →',
              en: 'Visit GDGoC Yonsei Homepage →',
            })}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
