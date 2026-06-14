import { motion } from 'motion/react'
import { EASE } from './variants'

/**
 * `FloatingCircle` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 */
export function FloatingCircle({
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
 */
export function ColorBar({ color }: { color: string }) {
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
 */
export function GoogleDots() {
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
 */
export function GoogleDotsLight() {
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

/**
 * `ActivityBullet` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 */
export function ActivityBullet({
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
