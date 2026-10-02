'use client'

import { useEffect, useRef } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'
import { mountWhenIdle } from '@/lib/motion/idle'

/**
 * 히어로 배경의 WebGL 하프톤 필드를 브라우저가 한가할 때 불러온다.
 * WebGL2가 없거나, 움직임 줄이기·데이터 절약을 켠 방문자에게는 서버가 그린 SVG
 * 브래킷만 보인다(그것만으로도 완성된 화면이다).
 */
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
