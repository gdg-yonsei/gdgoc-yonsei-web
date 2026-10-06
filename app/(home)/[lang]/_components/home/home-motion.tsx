'use client'

import { useEffect } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'
import { mountWhenIdle } from '@/lib/motion/idle'

/** 유휴 시간에 anime.js·장면 청크를 불러오며, 움직임 줄이기·데이터 절약에서는 받지 않는다.
 * 청크나 장면이 실패해도 정적 화면을 유지한다. */
export default function HomeMotion() {
  useEffect(() => {
    if (!shouldLoadMotion(readMotionEnvironment())) return

    const html = document.documentElement
    const unmount = mountWhenIdle(
      () => import('./motion/scenes'),
      ({ mountHomeScenes }) => {
        const teardown = mountHomeScenes(document)
        // 테스트(e2e)가 연출 준비 완료를 이 속성으로 확인한다.
        html.dataset.homeMotion = 'ready'
        return teardown
      }
    )

    return () => {
      unmount()
      delete html.dataset.homeMotion
    }
  }, [])

  return null
}
