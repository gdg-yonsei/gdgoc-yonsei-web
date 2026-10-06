'use client'

import { useEffect, useRef } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'
import { mountWhenIdle } from '@/lib/motion/idle'

/** 브라우저 유휴 시간에 WebGL을 불러오고, WebGL2 미지원·움직임 줄이기·데이터 절약에서는 서버 포스터를 유지한다. */
export default function BracketStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.closest<HTMLElement>('[data-hero]')
    if (!canvas || !hero) return
    if (!shouldLoadMotion(readMotionEnvironment())) return

    return mountWhenIdle(
      () => import('./bracket-field-gl'),
      ({ mountBracketField }) => mountBracketField(canvas, hero)
    )
  }, [])

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="bracket-canvas" />
  )
}
