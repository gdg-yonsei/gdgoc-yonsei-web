'use client'

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import GDGLogo from '@/app/components/svg/gdg-logo'
import { Locale } from '@/i18n-config'

const QRCode = lazy(() => import('react-qr-code'))

const SITE_URL = 'https://gdgoc.yonsei.ac.kr'
const SLIDE_COUNT = 9

type I18nText = { ko: string; en: string }
/**
 * `getLocalizedText` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`, `Locale`, `text`, `I18nText`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
const getLocalizedText = (lang: Locale, text: I18nText) => text[lang]

/* ═══════════════════════════════════════════════════════════════════════════
   Animation Variants
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
  },
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
   Decorative Components
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `FloatingCircle` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function FloatingCircle({
  color,
  size,
  left,
  top,
  delay = 0,
}: {
  color: string
  size: number
  left: string
  top: string
  delay?: number
}) {
  return (
    <motion.div
      className={`absolute rounded-full ${color}`}
      style={{ width: size, height: size, left, top }}
      animate={{
        y: [0, -25, 0, 25, 0],
        x: [0, 15, 0, -15, 0],
        scale: [1, 1.06, 1, 0.94, 1],
      }}
      transition={{
        duration: 14 + delay * 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

/**
 * `ColorBar` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`color`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function ColorBar({ color }: { color: string }) {
  return (
    <motion.div
      className={`mt-3 h-1.5 rounded-full ${color}`}
      style={{ originX: 0, width: 64 }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
    />
  )
}

/**
 * `GoogleDots` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function GoogleDots() {
  const colors = [
    'bg-gdg-blue-300',
    'bg-gdg-red-300',
    'bg-gdg-yellow-300',
    'bg-gdg-green-300',
  ]
  return (
    <div className="absolute top-4 left-4 flex gap-2 md:top-8 md:left-8 md:gap-3">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className={`h-3 w-3 rounded-full ${c}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.1 * i,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        />
      ))}
    </div>
  )
}

/**
 * `GoogleDotsLight` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function GoogleDotsLight() {
  const colors = [
    'bg-gdg-blue-200',
    'bg-gdg-red-200',
    'bg-gdg-yellow-200',
    'bg-gdg-green-200',
  ]
  return (
    <div className="absolute top-4 left-4 flex gap-2 md:top-8 md:left-8 md:gap-3">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className={`h-3 w-3 rounded-full ${c}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.1 * i,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 1 — Cover
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `CoverSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function CoverSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 2 — What is GDGoC?
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `WhatIsGDGoCSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function WhatIsGDGoCSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 3 — GDGoC Yonsei
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `GDGoCYonseiSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function GDGoCYonseiSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 4 — Activities: Session & Project
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `ActivityBullet` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function ActivityBullet({
  label,
  text,
  color,
}: {
  label: string
  text: string
  color: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
      <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
        <span className="font-semibold text-neutral-800">{label}</span> {text}
      </p>
    </div>
  )
}

/**
 * `ActivitiesSessionProjectSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function ActivitiesSessionProjectSlide({ lang }: { lang: Locale }) {
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
                  {getLocalizedText(lang, { ko: '기술 세션', en: 'Tech Sessions' })}
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
                  {getLocalizedText(lang, { ko: '팀 프로젝트', en: 'Team Projects' })}
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 5 — Activities: Networking & Hackathon
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `ActivitiesNetworkingHackathonSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function ActivitiesNetworkingHackathonSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 6 — Future Plans
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `FuturePlansSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function FuturePlansSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 7 — Recruitment: Dev Parts
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `RecruitmentDevSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function RecruitmentDevSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 8 — Recruitment: Design & Community Parts
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `RecruitmentDesignSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function RecruitmentDesignSlide({ lang }: { lang: Locale }) {
  const parts = [
    {
      name: 'Cloud',
      description: {
        ko: 'GCP 기반 클라우드 인프라 설계, 컨테이너 오케스트레이션, CI/CD 파이프라인 구축',
        en: 'GCP-based cloud infrastructure, container orchestration, and CI/CD pipeline development',
      },
      lookingFor: {
        ko: '클라우드 서비스(GCP/AWS), Docker, Kubernetes 등 인프라 기술에 대한 이해와 DevOps 경험',
        en: 'Understanding of cloud services (GCP/AWS), Docker, Kubernetes, and hands-on DevOps experience',
      },
      accent: 'bg-gdg-yellow-300',
      accentLight: 'bg-gdg-yellow-300/10',
      textAccent: 'text-gdg-yellow-300',
    },
    {
      name: 'UX / UI',
      description: {
        ko: '사용자 중심의 경험 설계, 인터페이스 디자인, 디자인 시스템 구축 및 프로토타이핑',
        en: 'User-centered experience design, interface design, design systems, and prototyping',
      },
      lookingFor: {
        ko: 'Figma 등 디자인 도구 활용 능력과 사용자 리서치 기반의 UX 설계 역량',
        en: 'Proficiency in design tools like Figma with user-research-driven UX design skills',
      },
      accent: 'bg-gdg-red-300',
      accentLight: 'bg-gdg-red-300/10',
      textAccent: 'text-gdg-red-300',
    },
    {
      name: 'DevRel',
      description: {
        ko: '개발자 커뮤니티 운영, 기술 콘텐츠 제작, 이벤트 기획 및 대외 협력',
        en: 'Developer community management, tech content creation, event planning, and partnerships',
      },
      lookingFor: {
        ko: '기술 커뮤니케이션 역량과 커뮤니티 빌딩에 대한 열정, 콘텐츠 기획 및 제작 능력',
        en: 'Strong tech communication skills, passion for community building, and content creation ability',
      },
      accent: 'bg-gdg-blue-300',
      accentLight: 'bg-gdg-blue-300/10',
      textAccent: 'text-gdg-blue-300',
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
          <ColorBar color="bg-gdg-blue-300" />
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

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 9 — Thank You
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `ThankYouSlide` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
function ThankYouSlide({ lang }: { lang: Locale }) {
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

/* ═══════════════════════════════════════════════════════════════════════════
   Main Presentation Component
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `FreshmanOTPresentation` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function FreshmanOTPresentation({ lang }: { lang: Locale }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const isAnimating = useRef(false)

  const slides = [
    <CoverSlide key="cover" lang={lang} />,
    <WhatIsGDGoCSlide key="what" lang={lang} />,
    <GDGoCYonseiSlide key="yonsei" lang={lang} />,
    <ActivitiesSessionProjectSlide key="activities-1" lang={lang} />,
    <ActivitiesNetworkingHackathonSlide key="activities-2" lang={lang} />,
    <FuturePlansSlide key="plans" lang={lang} />,
    <RecruitmentDevSlide key="recruit-dev" lang={lang} />,
    <RecruitmentDesignSlide key="recruit-design" lang={lang} />,
    <ThankYouSlide key="thanks" lang={lang} />,
  ]

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating.current) return
      if (index < 0 || index >= SLIDE_COUNT) return
      isAnimating.current = true
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
      setTimeout(() => {
        isAnimating.current = false
      }, 700)
    },
    [current]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    /**
     * `handleKeyDown` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
     *
     * 구동 원리:
     * 1. 입력값(`e`, `KeyboardEvent`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
     * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
     * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
     *
     * 작동 결과:
     * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
     * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          prev()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev])

  // Scroll navigation
  useEffect(() => {
    let lastTime = 0
    /**
     * `handleWheel` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
     *
     * 구동 원리:
     * 1. 입력값(`e`, `WheelEvent`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
     * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
     * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
     *
     * 작동 결과:
     * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
     * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
     */
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastTime < 800) return
      lastTime = now
      if (e.deltaY > 0) next()
      else if (e.deltaY < 0) prev()
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [next, prev])

  // Touch swipe navigation
  useEffect(() => {
    let startX = 0
    let startY = 0
    /**
     * `handleTouchStart` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
     *
     * 구동 원리:
     * 1. 입력값(`e`, `TouchEvent`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
     * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
     * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
     *
     * 작동 결과:
     * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
     * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
     */
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? 0
      startY = e.touches[0]?.clientY ?? 0
    }
    /**
     * `handleTouchEnd` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
     *
     * 구동 원리:
     * 1. 입력값(`e`, `TouchEvent`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
     * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
     * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
     *
     * 작동 결과:
     * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
     * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
     */
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = startX - (e.changedTouches[0]?.clientX ?? 0)
      const dy = startY - (e.changedTouches[0]?.clientY ?? 0)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) next()
        else prev()
      } else if (Math.abs(dy) > 50) {
        if (dy > 0) next()
        else prev()
      }
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [next, prev])

  // Click navigation (right half → next, left half → prev)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (x > rect.width * 0.5) next()
      else prev()
    },
    [next, prev]
  )

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? '80%' : '-80%',
      opacity: 0,
      scale: 0.94,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? '-40%' : '40%',
      opacity: 0,
      scale: 0.96,
    }),
  }

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-white select-none"
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
          className="absolute inset-0"
        >
          <div className="h-full overflow-y-auto">{slides[current]}</div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute right-0 bottom-0 left-0 z-50 flex gap-1 px-4 pb-4 md:gap-1.5 md:px-8 md:pb-6">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              goTo(i)
            }}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i === current
                ? 'bg-gdg-blue-300'
                : i < current
                  ? 'bg-gdg-blue-300/30'
                  : 'bg-neutral-300/60'
            }`}
          />
        ))}
      </div>

      {/* Slide number */}
      <div className="absolute right-4 bottom-7 z-50 font-mono text-xs tracking-widest text-neutral-400 md:right-8 md:bottom-10">
        {String(current + 1).padStart(2, '0')} /{' '}
        {String(SLIDE_COUNT).padStart(2, '0')}
      </div>
    </div>
  )
}
