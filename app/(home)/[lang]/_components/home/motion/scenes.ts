import { createScope, type Scope } from 'animejs'
import { MOTION_QUERIES, type Scene, type SceneMatches } from './scene'
import hero from './scenes/hero'
import join from './scenes/join'
import manifesto from './scenes/manifesto'
import log from './scenes/log'
import parts from './scenes/parts'
import programs from './scenes/programs'
import releases from './scenes/releases'

export type { Scene, SceneContext } from './scene'

const SCENES: Partial<Record<string, Scene>> = {
  hero,
  manifesto,
  programs,
  parts,
  log,
  releases,
  join,
}

/** 섹션이 한 화면 거리 안에 오면 붙이며, 정리·예외·모션 조건 변경 시 scope가 장면을 되돌린다. */
export function mountHomeScenes(
  doc: Document,
  scenes: Partial<Record<string, Scene>> = SCENES
): () => void {
  const scopes: Scope[] = []
  const armed: HTMLElement[] = []

  const arm = (section: HTMLElement) => {
    const scene = scenes[section.dataset.scene ?? '']
    if (!scene) return
    // content-visibility: auto로 숨긴 섹션은 장면이 측정하기 전에 내용 레이아웃을 활성화한다.

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

  // 한 화면 떨어진 섹션은 다음 유휴 시간(300ms 안)에 준비해 스크롤 프레임을 막지 않는다.

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
