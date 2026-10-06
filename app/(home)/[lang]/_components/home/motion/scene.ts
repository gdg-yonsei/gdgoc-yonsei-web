/** 섹션별 anime.js 장면은 점진적 향상이다. JS 미지원·움직임 줄이기에서는 정적 페이지를 유지한다. */
import type { Scope } from 'animejs'

/** 랜딩 페이지의 모든 scope가 지켜보는 미디어 조건. 하나라도 바뀌면 anime.js가 scope를 다시 만든다. */
export const MOTION_QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  fine: '(hover: hover) and (pointer: fine)',
  stack: '(min-width: 768px) and (min-height: 40rem)',
  wide: '(min-width: 1024px)',
} as const

export type SceneMatches = Record<keyof typeof MOTION_QUERIES, boolean>

export type SceneContext = {
  root: HTMLElement
  /** 이벤트에서 만드는 애니메이션은 `scope.add(name, fn)`으로 등록해야 scope 정리 때 함께 되돌아간다. */
  scope: Scope
  matches: SceneMatches
  /** 화면 아래에 완전히 숨은 요소에만 등장 시작 상태를 주어, 이미 보이는 요소가 갑자기 튀지 않게 한다. */
  belowFold: (element?: Element) => boolean
}

/** 반환하는 정리 함수는 scope가 추적하지 않는 이벤트 리스너·DOM 노드를 되돌린다. */
export type Scene = (context: SceneContext) => void | (() => void)
