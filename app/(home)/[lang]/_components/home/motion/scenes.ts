/**
 * 홈 페이지 장면 등록과 지연 실행(클라이언트 전용). `home-motion.tsx`가 유휴 시간에 불러와 실행한다.
 */
import { createScope, type Scope } from 'animejs'
import { MOTION_QUERIES, type Scene, type SceneMatches } from './scene'
import hero from './scenes/hero'
import join from './scenes/join'
import manifesto from './scenes/manifesto'
import log from './scenes/log'
import parts from './scenes/parts'
import programs from './scenes/programs'
import releases from './scenes/releases'

/** 장면 타입을 이 모듈에서도 가져다 쓸 수 있게 다시 내보낸다. */
export type { Scene, SceneContext } from './scene'

/** 랜딩 장면 목록. 키는 각 섹션의 `data-scene` 값이다. */
const SCENES: Partial<Record<string, Scene>> = {
  hero,
  manifesto,
  programs,
  parts,
  log,
  releases,
  join,
}

/**
 * 각 `[data-scene]` 섹션이 뷰포트에서 한 화면 거리 안으로 들어오면 그 섹션의 장면을 붙인다.
 *
 * 장면마다 섹션을 루트로 하는 anime.js scope에서 실행되므로 스스로 되돌아간다: 정리할 때,
 * 장면이 예외를 던졌을 때, 모션 미디어 쿼리가 바뀔 때(움직임 줄이기를 켜면 정적 페이지로 돌아감).
 * @param doc 장면을 찾을 문서
 * @param scenes 장면 목록(테스트에서 바꿔 넣는다)
 * @returns 모든 장면을 되돌리고 관찰을 멈추는 정리 함수
 */
export function mountHomeScenes(
  doc: Document,
  scenes: Partial<Record<string, Scene>> = SCENES
): () => void {
  const scopes: Scope[] = []
  const armed: HTMLElement[] = []

  const arm = (section: HTMLElement) => {
    const scene = scenes[section.dataset.scene ?? '']
    if (!scene) return
    // 섹션은 뷰포트 가까이 오기 전까지 내용 레이아웃을 건너뛴다(content-visibility: auto).
    // 장면은 지금 그 내용을 측정해야 하므로 보이게 바꾼다.
    section.style.contentVisibility = 'visible'
    armed.push(section)
    const belowFold = (element: Element = section) =>
      element.getBoundingClientRect().top >= innerHeight

    const scope: Scope = createScope({
      root: section,
      mediaQueries: MOTION_QUERIES,
    }).add((self) => {
      const matches = self?.matches as SceneMatches | undefined
      if (!self || !matches?.motion) return

      let cleanup: void | (() => void)
      try {
        cleanup = scene({ root: section, scope: self, matches, belowFold })
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error(error)
        // 예외가 나기 전까지 장면이 만든 것을 모두 되돌린다.
        queueMicrotask(() => scope.revert())
        return
      }

      section.dataset.motion = 'js'
      return () => {
        cleanup?.()
        delete section.dataset.motion
      }
    })
    scopes.push(scope)
  }

  // 범위에 들어온 섹션도 아직 한 화면 떨어져 있다. 브라우저가 다음에 한가할 때(300ms 안) 장면을
  // 붙여, 레이아웃과 준비 작업이 스크롤 프레임을 방해하지 않게 한다.
  const hasIdle = typeof requestIdleCallback === 'function'
  const pending = new Set<number>()
  const schedule = (section: HTMLElement) => {
    const run = () => {
      pending.delete(handle)
      arm(section)
    }
    const handle = hasIdle
      ? requestIdleCallback(run, { timeout: 300 })
      : window.setTimeout(run, 0)
    pending.add(handle)
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        schedule(entry.target as HTMLElement)
      }
    },
    { rootMargin: '0px 0px 100% 0px' }
  )
  for (const section of doc.querySelectorAll<HTMLElement>('[data-scene]')) {
    observer.observe(section)
  }

  return () => {
    observer.disconnect()
    for (const handle of pending) {
      if (hasIdle) cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
    pending.clear()
    for (const scope of scopes.splice(0)) scope.revert()
    for (const section of armed.splice(0)) {
      section.style.removeProperty('content-visibility')
    }
  }
}
