'use client'

/**
 * 홈 화면 스크롤 연출 로더(클라이언트 컴포넌트). 화면에는 아무것도 그리지 않는다.
 */
import { useEffect } from 'react'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'
import { mountWhenIdle } from '@/lib/motion/idle'

/**
 * 브라우저가 한가해지면 홈 화면 스크롤 연출을 시작한다. anime.js와 섹션 장면
 * (`./motion/scenes`)은 별도 청크로 내려받는다. 움직임 줄이기·데이터 절약 방문자는
 * 내려받지 않으며, 청크나 장면이 실패해도 정적 화면이 남는다. 아무것도 렌더링하지
 * 않는다.
 */
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
