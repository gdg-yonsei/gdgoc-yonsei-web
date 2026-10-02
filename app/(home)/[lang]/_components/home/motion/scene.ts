/**
 * 홈(랜딩) 페이지 스크롤 연출의 공통 타입과 미디어 조건.
 *
 * 연출은 anime.js로 구현하며, 섹션마다 `scenes/*.ts`의 장면 함수 하나가 맡는다. 연출은
 * 점진적 향상이다. JS가 없거나 움직임 줄이기를 켜면 정적 페이지가 그대로 보인다.
 */
import type { Scope } from 'animejs'

/** 랜딩 페이지의 모든 scope가 지켜보는 미디어 조건. 하나라도 바뀌면 anime.js가 scope를 다시 만든다. */
export const MOTION_QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  fine: '(hover: hover) and (pointer: fine)',
  stack: '(min-width: 768px) and (min-height: 40rem)',
  wide: '(min-width: 1024px)',
} as const

/** `MOTION_QUERIES` 각각의 현재 일치 여부. */
export type SceneMatches = Record<keyof typeof MOTION_QUERIES, boolean>

/** 장면 함수가 받는 실행 환경. */
export type SceneContext = {
  /** 장면이 움직이는 섹션. scope의 루트이기도 하다. */
  root: HTMLElement
  /**
   * 섹션의 anime.js scope. 나중에(이벤트 핸들러 안에서) 만드는 애니메이션은 반드시
   * `scope.add(name, fn)`으로 등록한 메서드에서 만들어야, scope를 되돌릴 때 함께 정리된다.
   */
  scope: Scope
  matches: SceneMatches
  /**
   * 요소(기본값은 섹션)가 아직 화면 아래에 완전히 숨어 있는지. 이런 요소에만 등장 애니메이션의
   * 시작(from) 상태를 줄 수 있다. 방문자에게 이미 보이는 것이 갑자기 튀는 일이 없게 하기 위해서다.
   */
  belowFold: (element?: Element) => boolean
}

/**
 * 섹션 하나의 연출. 돌려주는 함수는 scope가 스스로 추적하지 않는 것(이벤트 리스너, 장면이 만든
 * DOM 노드)을 되돌린다.
 */
export type Scene = (context: SceneContext) => void | (() => void)
