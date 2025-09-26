import { TargetAndTransition, VariantLabels } from 'motion'
import * as motion from 'motion/react-client'

/**
 * 여러 색상의 별동별을 생성하는 컴포넌트
 * @param className
 * @param repeatDelay
 * @param animate
 * @param initial
 * @param duration
 * @constructor
 */
function ShootingStar({
  className,
  repeatDelay = 0,
  animate = {
    x: [0, 40000],
    y: [0, -40000],
  },
  initial = {
    rotate: 135,
  },
  duration = 2,
}: {
  className: string
  repeatDelay?: number
  animate?: boolean | TargetAndTransition | VariantLabels | undefined
  initial?: boolean | TargetAndTransition | VariantLabels | undefined
  duration?: number
}) {
  return (
    <motion.div
      className={`absolute -z-10 h-4 w-24 rounded-full opacity-70 ${className}`}
      initial={initial}
      animate={animate}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatDelay: repeatDelay,
        delay: repeatDelay,
      }}
    />
  )
}

/**
 * 첫 화면 배경을 만드는 컴포넌트
 * @constructor
 */
export default function HomePageBackground() {
  return (
    <>
      <ShootingStar
        className={'bg-gdg-red-300 top-96 -left-24'}
        repeatDelay={0.5}
        animate={{
          x: [0, 4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 135,
        }}
        duration={4}
      />
      <ShootingStar
        className={'bg-gdg-red-300 -bottom-0 -left-24'}
        repeatDelay={0}
        animate={{
          x: [0, 4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 135,
        }}
        duration={3}
      />
      <ShootingStar
        className={'bg-gdg-red-300 -bottom-24 -left-24'}
        repeatDelay={2}
        animate={{
          x: [0, 4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 135,
        }}
        duration={5}
      />
      <ShootingStar
        className={'bg-gdg-blue-300 -right-24 bottom-0'}
        repeatDelay={0.5}
        animate={{
          x: [0, -4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={3}
      />
      <ShootingStar
        className={'bg-gdg-blue-300 -right-24 bottom-48'}
        repeatDelay={0}
        animate={{
          x: [0, -4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={6}
      />
      <ShootingStar
        className={'bg-gdg-blue-300 top-96 -right-24'}
        repeatDelay={1}
        animate={{
          x: [0, -4000],
          y: [0, -4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={4}
      />
      <ShootingStar
        className={'bg-gdg-green-300 top-0 -right-24'}
        repeatDelay={1}
        animate={{
          x: [0, -4000],
          y: [0, 4000],
        }}
        initial={{
          rotate: 135,
        }}
        duration={3}
      />
      <ShootingStar
        className={'bg-gdg-green-300 top-48 -right-24'}
        repeatDelay={2}
        animate={{
          x: [0, -4000],
          y: [0, 4000],
        }}
        initial={{
          rotate: 135,
        }}
        duration={4}
      />
      <ShootingStar
        className={'top-24 -left-24 bg-yellow-500'}
        repeatDelay={0}
        animate={{
          x: [0, 4000],
          y: [0, 4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={4}
      />
      <ShootingStar
        className={'top-48 -left-24 bg-yellow-500'}
        repeatDelay={2}
        animate={{
          x: [0, 4000],
          y: [0, 4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={3}
      />
      <ShootingStar
        className={'top-96 -left-24 bg-yellow-500'}
        repeatDelay={1.5}
        animate={{
          x: [0, 4000],
          y: [0, 4000],
        }}
        initial={{
          rotate: 45,
        }}
        duration={5}
      />
    </>
  )
}
