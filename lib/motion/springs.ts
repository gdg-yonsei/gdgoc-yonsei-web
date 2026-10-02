/**
 * 홈 화면 스프링 이징 정의(anime.js `spring()` 매개변수).
 */

/**
 * 홈 화면 스프링 곡선. `site-theme.css`에 같은 곡선이 `linear()` 토큰(--ease-spring, -snap,
 * -soft)으로 있어 CSS 전환과 스크립트 장면이 똑같이 멈춘다. 둘이 어긋나지 않도록
 * `tests/lib/motion/springs.test.ts`가 비교한다.
 */
export const SPRINGS = {
  /** 기본: 빠르게 올라가 살짝 넘쳤다가 멈춘다. */
  spring: { bounce: 0.2, duration: 700 },
  /** 경쾌하게: 칩, 점, 글리프 조각처럼 톡 튀는 작은 요소용. */
  snap: { bounce: 0.35, duration: 520 },
  /** 넘침 없이: 미끄러지듯 움직여야 하는 큰 면용. */
  soft: { bounce: 0, duration: 900 },
} as const

/** 스프링 이름(spring, snap, soft). */
export type SpringName = keyof typeof SPRINGS

/** CSS `linear()` 토큰의 구간 수. 41개 지점이면 오차 1% 미만으로 곡선을 따라가면서
    전역 스타일시트도 작게 유지한다. */
export const SPRING_SAMPLES = 40
