// CSS linear() 토큰과 이 곡선이 같아야 CSS 전환·스크립트 연출이 같은 방식으로 멈춘다.
export const SPRINGS = {
  /** 기본: 빠르게 올라가 살짝 넘쳤다가 멈춘다. */
  spring: { bounce: 0.2, duration: 700 },
  /** 경쾌하게: 칩, 점, 글리프 조각처럼 톡 튀는 작은 요소용. */
  snap: { bounce: 0.35, duration: 520 },
  /** 넘침 없이: 미끄러지듯 움직여야 하는 큰 면용. */
  soft: { bounce: 0, duration: 900 },
} as const

export type SpringName = keyof typeof SPRINGS

// linear()를 41개 지점으로 근사하면 곡선 오차를 1% 미만으로 유지한다.
export const SPRING_SAMPLES = 40
