'use client'

import { useEffect, useRef } from 'react'

const STAR_COLORS = ['#4285f4', '#34a853', '#f9ab00', '#ea4335', '#1b3a75']
const STAR_DENSITY = 1 / 14000 // px²당 별 밀도
const STREAK_INTERVAL_MS = 2600
const STREAK_LIFETIME_MS = 900

type Star = {
  x: number
  y: number
  radius: number
  color: string
  phase: number
  speed: number
}

type Streak = {
  x: number
  y: number
  angle: number
  bornAt: number
  color: string
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    let stars: Star[] = []
    let streaks: Streak[] = []
    let rafId = 0
    let lastStreakAt = 0
    let width = 0
    let height = 0

    function pickColor(): string {
      return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!
    }

    function seedStars() {
      const count = Math.max(30, Math.round(width * height * STAR_DENSITY))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.6 + Math.random() * 1.6,
        color: pickColor(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
      }))
    }

    function drawFrame(time: number) {
      if (!context) {
        return
      }
      context.clearRect(0, 0, width, height)

      for (const star of stars) {
        const twinkle = reduceMotion
          ? 0.55
          : 0.3 +
            0.45 * Math.abs(Math.sin(star.phase + time * 0.001 * star.speed))
        context.globalAlpha = twinkle
        context.fillStyle = star.color
        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fill()
      }

      if (!reduceMotion) {
        if (time - lastStreakAt > STREAK_INTERVAL_MS) {
          lastStreakAt = time
          streaks.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.5,
            angle: Math.random() > 0.5 ? Math.PI / 4 : (3 * Math.PI) / 4,
            bornAt: time,
            color: pickColor(),
          })
        }
        streaks = streaks.filter(
          (streak) => time - streak.bornAt < STREAK_LIFETIME_MS
        )
        for (const streak of streaks) {
          const progress = (time - streak.bornAt) / STREAK_LIFETIME_MS
          const distance = progress * 220
          const headX = streak.x + Math.cos(streak.angle) * distance
          const headY = streak.y + Math.sin(streak.angle) * distance
          context.globalAlpha = 0.7 * (1 - progress)
          context.strokeStyle = streak.color
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(
            headX - Math.cos(streak.angle) * 60,
            headY - Math.sin(streak.angle) * 60
          )
          context.lineTo(headX, headY)
          context.stroke()
        }
      }

      context.globalAlpha = 1
    }

    function loop(time: number) {
      drawFrame(time)
      rafId = requestAnimationFrame(loop)
    }

    function resize() {
      if (!canvas || !context) {
        return
      }
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      seedStars()
      if (reduceMotion) {
        drawFrame(0)
      }
    }

    function handleVisibility() {
      cancelAnimationFrame(rafId)
      if (!document.hidden && !reduceMotion) {
        rafId = requestAnimationFrame(loop)
      }
    }

    resize()
    if (!reduceMotion) {
      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={'absolute inset-0 -z-10 h-full w-full'}
    />
  )
}
