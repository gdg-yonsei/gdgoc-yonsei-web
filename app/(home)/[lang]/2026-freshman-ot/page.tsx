'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GDGLogo from '@/app/components/svg/gdg-logo'

const SLIDE_COUNT = 8

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

function GoogleDots() {
  const colors = [
    'bg-gdg-blue-300',
    'bg-gdg-red-300',
    'bg-gdg-yellow-300',
    'bg-gdg-green-300',
  ]
  return (
    <div className="absolute top-8 left-8 flex gap-3">
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

function GoogleDotsLight() {
  const colors = [
    'bg-gdg-blue-200',
    'bg-gdg-red-200',
    'bg-gdg-yellow-200',
    'bg-gdg-green-200',
  ]
  return (
    <div className="absolute top-8 left-8 flex gap-3">
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

function CoverSlide() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
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
        className="relative z-10 flex flex-col items-center gap-6 px-4 md:gap-8"
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
          <p className="rounded-full bg-neutral-100 px-6 py-2.5 text-base text-neutral-500 md:px-8 md:py-3 md:text-lg">
            2026 첨단컴퓨팅학부 신입생 OT
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 2 — What is GDGoC?
   ═══════════════════════════════════════════════════════════════════════════ */

function WhatIsGDGoCSlide() {
  const points = [
    {
      color: 'bg-gdg-blue-300',
      text: '전 세계 1,900개 이상의 대학에서 운영되는 글로벌 개발자 커뮤니티',
    },
    {
      color: 'bg-gdg-red-300',
      text: 'Google의 기술과 리소스를 활용한 실전 중심의 학습 환경',
    },
    {
      color: 'bg-gdg-green-300',
      text: '다양한 분야의 개발자들과 교류하며 함께 성장하는 기회',
    },
    {
      color: 'bg-gdg-yellow-300',
      text: 'Google 공식 지원을 통한 글로벌 네트워킹과 커리어 성장',
    },
  ]

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex max-w-4xl flex-col gap-8 px-8 md:gap-12"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <h2 className="text-4xl font-bold text-neutral-800 md:text-5xl lg:text-6xl">
            GDGoC란?
          </h2>
          <ColorBar color="bg-gdg-blue-300" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-xl leading-relaxed text-neutral-600 md:text-2xl"
        >
          <span className="font-semibold text-neutral-800">
            Google Developer Group on Campus
          </span>
          는 <span className="text-logo-blue font-semibold">Google</span>이
          지원하는 전 세계 대학 개발자 커뮤니티입니다.
        </motion.p>

        <div className="flex flex-col gap-4 md:gap-5">
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
              <p className="text-lg text-neutral-700 md:text-xl">
                {point.text}
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

function GDGoCYonseiSlide() {
  const values = [
    {
      title: 'Community',
      description:
        '다양한 배경의 개발자들이 모여 교류하고 함께 성장하는 커뮤니티를 만들어갑니다.',
      borderColor: 'border-gdg-red-300',
      bg: 'bg-gdg-red-100/50',
      dot: 'bg-gdg-red-300',
    },
    {
      title: 'Technology',
      description:
        'Google의 최신 기술을 학습하고 실제 프로젝트에 적용하며 기술적 역량을 키웁니다.',
      borderColor: 'border-gdg-green-300',
      bg: 'bg-gdg-green-100/50',
      dot: 'bg-gdg-green-300',
    },
    {
      title: 'Growth',
      description:
        '지속 가능한 성장을 추구하며, 함께 발전하는 개발 문화를 만들어갑니다.',
      borderColor: 'border-gdg-blue-300',
      bg: 'bg-gdg-blue-100/50',
      dot: 'bg-gdg-blue-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex h-full w-full items-center justify-center overflow-hidden">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex max-w-5xl flex-col items-center gap-10 px-8 md:gap-14"
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
          className="text-center text-lg text-neutral-600 md:text-xl"
        >
          연세대학교에서 활동하는 Google Developer Group on Campus입니다.
        </motion.p>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className={`rounded-2xl border-2 ${v.borderColor} ${v.bg} p-6 md:p-8`}
            >
              <motion.div
                className={`mb-4 h-3 w-3 rounded-full ${v.dot}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.8 + i * 0.15,
                  type: 'spring',
                  stiffness: 300,
                }}
              />
              <h3 className="mb-3 text-xl font-bold text-neutral-800 md:text-2xl">
                {v.title}
              </h3>
              <p className="text-base leading-relaxed text-neutral-600 md:text-lg">
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 4 — Activities
   ═══════════════════════════════════════════════════════════════════════════ */

function ActivitiesSlide() {
  const activities = [
    {
      title: 'Session',
      subtitle: '기술 세션',
      description:
        '파트별 기술 세션을 통해 깊이 있는 학습을 진행합니다. 실무에서 활용 가능한 기술을 함께 배웁니다.',
      accent: 'bg-gdg-blue-300',
      badge: 'bg-gdg-blue-100 text-gdg-blue-300',
    },
    {
      title: 'Project',
      subtitle: '팀 프로젝트',
      description:
        '팀을 이루어 실제 서비스를 기획하고 개발합니다. 아이디어를 현실로 만드는 경험을 제공합니다.',
      accent: 'bg-gdg-red-300',
      badge: 'bg-gdg-red-100 text-gdg-red-300',
    },
    {
      title: 'Networking',
      subtitle: '네트워킹',
      description:
        'Google 및 국내외 다양한 GDGoC 챕터들과 교류하며 글로벌 네트워크를 구축합니다.',
      accent: 'bg-gdg-green-300',
      badge: 'bg-gdg-green-100 text-gdg-green-300',
    },
    {
      title: 'Hackathon',
      subtitle: '해커톤',
      description:
        '다양한 해커톤에 참가하고 주최하며, 짧은 시간 안에 창의적인 솔루션을 만들어냅니다.',
      accent: 'bg-gdg-yellow-300',
      badge: 'bg-gdg-yellow-100 text-gdg-yellow-300',
    },
  ]

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex max-w-5xl flex-col items-center gap-8 px-8 md:gap-12"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="text-center">
          <h2 className="text-4xl font-bold text-neutral-800 md:text-5xl lg:text-6xl">
            주요 활동
          </h2>
          <div className="flex justify-center">
            <ColorBar color="bg-gdg-red-300" />
          </div>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          {activities.map((a, i) => (
            <motion.div
              key={i}
              variants={i % 2 === 0 ? fadeInLeft : fadeInRight}
              className="group relative overflow-hidden rounded-2xl bg-neutral-50 p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"
            >
              <div
                className={`absolute top-0 left-0 h-full w-1.5 ${a.accent}`}
              />
              <div className="pl-4">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-xl font-bold text-neutral-800 md:text-2xl">
                    {a.title}
                  </h3>
                  <span
                    className={`rounded-full ${a.badge} px-3 py-0.5 text-sm font-semibold`}
                  >
                    {a.subtitle}
                  </span>
                </div>
                <p className="text-base leading-relaxed text-neutral-600 md:text-lg">
                  {a.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 5 — Future Plans
   ═══════════════════════════════════════════════════════════════════════════ */

function FuturePlansSlide() {
  return (
    <div className="bg-gdg-black relative flex h-full w-full items-center justify-center overflow-hidden">
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
        className="relative z-10 flex max-w-4xl flex-col gap-10 px-8 md:gap-14"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <h2 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            향후 계획
          </h2>
          <ColorBar color="bg-gdg-yellow-300" />
        </motion.div>

        {/* 한일연합해커톤 */}
        <motion.div
          variants={fadeInLeft}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8"
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
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  2026 한일연합해커톤
                </h3>
                <span className="bg-gdg-blue-300/20 text-gdg-blue-200 rounded-full px-3 py-1 text-sm font-medium">
                  5월 예정
                </span>
              </div>
              <p className="text-lg text-neutral-300 md:text-xl">
                한국 서울에서 개최되는 한일 대학생 개발자 연합 해커톤
              </p>
              <p className="text-base text-neutral-500">
                한국과 일본의 대학생 개발자들이 함께 모여 혁신적인 솔루션을
                만들어내는 특별한 경험
              </p>
            </div>
          </div>
        </motion.div>

        {/* Core Member & Member 선발 */}
        <motion.div
          variants={fadeInLeft}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8"
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
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  26-27 Core Member & Member 선발
                </h3>
                <span className="bg-gdg-green-300/20 text-gdg-green-200 rounded-full px-3 py-1 text-sm font-medium">
                  2학기 전 예정
                </span>
              </div>
              <p className="text-lg text-neutral-300 md:text-xl">
                2026 2학기 전, 26-27 Core Member 및 Member 선발 예정
              </p>
              <p className="text-base text-neutral-500">
                함께 GDGoC Yonsei를 이끌어갈 열정적인 멤버를 찾고 있습니다
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Slide 6 — Recruitment: Dev Parts
   ═══════════════════════════════════════════════════════════════════════════ */

function RecruitmentDevSlide() {
  const parts = [
    {
      name: 'Front-end',
      description:
        'React, Next.js 등 모던 프레임워크를 활용한 웹 애플리케이션 UI 개발',
      lookingFor:
        '모던 웹 기술(React, TypeScript)에 대한 깊은 이해와 사용자 경험을 고려한 개발 역량',
      accent: 'bg-gdg-blue-300',
      accentLight: 'bg-gdg-blue-300/10',
      textAccent: 'text-gdg-blue-300',
    },
    {
      name: 'Back-end',
      description:
        '서버 아키텍처 설계, RESTful API 개발, 데이터베이스 설계 및 최적화',
      lookingFor:
        '서버 아키텍처, API 설계, 데이터베이스에 대한 탄탄한 이해와 확장 가능한 시스템 설계 능력',
      accent: 'bg-gdg-green-300',
      accentLight: 'bg-gdg-green-300/10',
      textAccent: 'text-gdg-green-300',
    },
    {
      name: 'ML / AI',
      description:
        '머신러닝, 딥러닝 모델 개발 및 데이터 파이프라인 구축, LLM 활용',
      lookingFor:
        'Python, TensorFlow/PyTorch 등 ML 프레임워크 경험과 문제 해결을 위한 모델링 역량',
      accent: 'bg-gdg-red-300',
      accentLight: 'bg-gdg-red-300/10',
      textAccent: 'text-gdg-red-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex h-full w-full items-center justify-center overflow-hidden">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex max-w-6xl flex-col gap-8 px-8 md:gap-10"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <p className="text-gdg-blue-300 mb-1 text-sm font-semibold tracking-widest uppercase md:text-base">
            We&apos;re looking for
          </p>
          <h2 className="text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            모집 파트 소개
          </h2>
          <ColorBar color="bg-gdg-green-300" />
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
          {parts.map((p, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm md:p-6"
            >
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${p.accent}`}
              />
              <div className="flex flex-col gap-3">
                <h3 className={`text-xl font-bold ${p.textAccent} md:text-2xl`}>
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  {p.description}
                </p>
                <div className={`rounded-xl ${p.accentLight} p-3`}>
                  <p className="text-xs font-semibold text-neutral-500 md:text-sm">
                    Ideal Candidate
                  </p>
                  <p className="mt-1 text-sm leading-snug text-neutral-700 md:text-base">
                    {p.lookingFor}
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
   Slide 7 — Recruitment: Design & Community Parts
   ═══════════════════════════════════════════════════════════════════════════ */

function RecruitmentDesignSlide() {
  const parts = [
    {
      name: 'Cloud',
      description:
        'GCP 기반 클라우드 인프라 설계, 컨테이너 오케스트레이션, CI/CD 파이프라인 구축',
      lookingFor:
        '클라우드 서비스(GCP/AWS), Docker, Kubernetes 등 인프라 기술에 대한 이해와 DevOps 경험',
      accent: 'bg-gdg-yellow-300',
      accentLight: 'bg-gdg-yellow-300/10',
      textAccent: 'text-gdg-yellow-300',
    },
    {
      name: 'UX / UI',
      description:
        '사용자 중심의 경험 설계, 인터페이스 디자인, 디자인 시스템 구축 및 프로토타이핑',
      lookingFor:
        'Figma 등 디자인 도구 활용 능력과 사용자 리서치 기반의 UX 설계 역량',
      accent: 'bg-gdg-red-300',
      accentLight: 'bg-gdg-red-300/10',
      textAccent: 'text-gdg-red-300',
    },
    {
      name: 'DevRel',
      description:
        '개발자 커뮤니티 운영, 기술 콘텐츠 제작, 이벤트 기획 및 대외 협력',
      lookingFor:
        '기술 커뮤니케이션 역량과 커뮤니티 빌딩에 대한 열정, 콘텐츠 기획 및 제작 능력',
      accent: 'bg-gdg-blue-300',
      accentLight: 'bg-gdg-blue-300/10',
      textAccent: 'text-gdg-blue-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex h-full w-full items-center justify-center overflow-hidden">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex max-w-6xl flex-col gap-8 px-8 md:gap-10"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <p className="text-gdg-blue-300 mb-1 text-sm font-semibold tracking-widest uppercase md:text-base">
            We&apos;re looking for
          </p>
          <h2 className="text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            모집 파트 소개
          </h2>
          <ColorBar color="bg-gdg-blue-300" />
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
          {parts.map((p, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm md:p-6"
            >
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${p.accent}`}
              />
              <div className="flex flex-col gap-3">
                <h3 className={`text-xl font-bold ${p.textAccent} md:text-2xl`}>
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  {p.description}
                </p>
                <div className={`rounded-xl ${p.accentLight} p-3`}>
                  <p className="text-xs font-semibold text-neutral-500 md:text-sm">
                    Ideal Candidate
                  </p>
                  <p className="mt-1 text-sm leading-snug text-neutral-700 md:text-base">
                    {p.lookingFor}
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
   Slide 8 — Thank You
   ═══════════════════════════════════════════════════════════════════════════ */

function ThankYouSlide() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
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
        className="relative z-10 flex flex-col items-center gap-6 px-4 md:gap-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={scaleIn}>
          <GDGLogo className="w-28 md:w-40" svgKey="ot-thanks" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="text-4xl font-bold text-neutral-800 md:text-5xl lg:text-6xl"
        >
          감사합니다
        </motion.h2>

        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-lg text-neutral-600 md:text-xl">
            Google Developer Group on Campus
          </p>
          <p className="text-logo-blue text-base font-medium md:text-lg">
            Yonsei University
          </p>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-base text-neutral-400 md:text-lg"
        >
          함께 성장해요!
        </motion.p>

        {/* Organizer Contact */}
        <motion.div
          variants={fadeUp}
          className="mt-2 flex flex-col items-center gap-4 rounded-2xl bg-neutral-50 px-10 py-6 md:mt-4 md:px-14 md:py-8"
        >
          <p className="text-sm font-semibold tracking-widest text-neutral-400 uppercase">
            Organizer
          </p>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xl font-bold text-neutral-800 md:text-2xl">
              {/* TODO: Organizer 이름을 입력하세요 */}
              홍길동
            </p>
            <p className="text-base text-neutral-500 md:text-lg">
              {/* TODO: Organizer 역할을 입력하세요 */}
              GDGoC Yonsei Organizer
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 text-sm text-neutral-500 md:text-base">
            <p>
              {/* TODO: 이메일을 입력하세요 */}
              organizer@gdgoc-yonsei.com
            </p>
            <p>
              {/* TODO: Instagram 등 SNS를 입력하세요 */}
              @gdgoc_yonsei
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Presentation Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function FreshmanOTPage() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const isAnimating = useRef(false)

  const slides = [
    <CoverSlide key="cover" />,
    <WhatIsGDGoCSlide key="what" />,
    <GDGoCYonseiSlide key="yonsei" />,
    <ActivitiesSlide key="activities" />,
    <FuturePlansSlide key="plans" />,
    <RecruitmentDevSlide key="recruit-dev" />,
    <RecruitmentDesignSlide key="recruit-design" />,
    <ThankYouSlide key="thanks" />,
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
    const handler = (e: KeyboardEvent) => {
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
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  // Scroll navigation
  useEffect(() => {
    let lastTime = 0
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastTime < 800) return
      lastTime = now
      if (e.deltaY > 0) next()
      else if (e.deltaY < 0) prev()
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [next, prev])

  // Touch swipe navigation
  useEffect(() => {
    let startX = 0
    let startY = 0
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onEnd = (e: TouchEvent) => {
      const dx = startX - e.changedTouches[0].clientX
      const dy = startY - e.changedTouches[0].clientY
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) next()
        else prev()
      } else if (Math.abs(dy) > 50) {
        if (dy > 0) next()
        else prev()
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
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
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute right-0 bottom-0 left-0 z-50 flex gap-1.5 px-8 pb-6">
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
      <div className="absolute right-8 bottom-10 z-50 font-mono text-xs tracking-widest text-neutral-400">
        {String(current + 1).padStart(2, '0')} /{' '}
        {String(SLIDE_COUNT).padStart(2, '0')}
      </div>
    </div>
  )
}
