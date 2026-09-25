import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mountHomeScenes,
  type Scene,
} from '@/app/(home)/[lang]/_components/home/motion/scenes'

/** An IntersectionObserver the test drives by hand. */
class DrivenObserver {
  static current: DrivenObserver | undefined
  observed: Element[] = []
  constructor(
    private callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit
  ) {
    DrivenObserver.current = this
  }
  observe = (element: Element) => this.observed.push(element)
  unobserve = vi.fn((element: Element) => {
    this.observed = this.observed.filter((item) => item !== element)
  })
  disconnect = vi.fn()
  enter(element: Element) {
    this.callback(
      [{ target: element, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
}

function stubMedia({ reduce = false } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('reduced-motion') ? !reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

function page(...names: string[]) {
  document.body.innerHTML = `<main>${names
    .map((name) => `<section data-scene="${name}"></section>`)
    .join('')}</main>`
  return names.map(
    (name) => document.querySelector<HTMLElement>(`[data-scene="${name}"]`)!
  )
}

/** Idle callbacks the registry queued; `idle()` runs them. */
let idleQueue: Array<() => void> = []
const idle = () => {
  const queued = idleQueue
  idleQueue = []
  queued.forEach((run) => run())
}

describe('mountHomeScenes', () => {
  // vitest.setup.ts defines IntersectionObserver writable but not
  // configurable, so it is swapped by assignment rather than stubGlobal.
  const original = globalThis.IntersectionObserver
  beforeEach(() => {
    globalThis.IntersectionObserver =
      DrivenObserver as unknown as typeof IntersectionObserver
    idleQueue = []
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn((callback: () => void) => idleQueue.push(callback))
    )
    vi.stubGlobal(
      'cancelIdleCallback',
      vi.fn((handle: number) => {
        idleQueue[handle - 1] = () => {}
      })
    )
  })

  afterEach(() => {
    globalThis.IntersectionObserver = original
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('arms each section once it comes within a screen of the viewport', () => {
    stubMedia()
    const [programs] = page('programs')
    const scene = vi.fn<Scene>()
    mountHomeScenes(document, { programs: scene })

    expect(DrivenObserver.current?.options?.rootMargin).toBe(
      '0px 0px 100% 0px'
    )
    expect(scene).not.toHaveBeenCalled()

    // In range, a section arms when the browser is next idle, keeping the
    // work out of scroll frames.
    DrivenObserver.current?.enter(programs!)
    expect(scene).not.toHaveBeenCalled()
    idle()
    expect(scene).toHaveBeenCalledTimes(1)
    expect(scene.mock.calls[0]?.[0].root).toBe(programs)
    expect(programs).toHaveAttribute('data-motion', 'js')
  })

  it('lets a scene ask which of its blocks are still below the fold', () => {
    stubMedia()
    const [manifesto] = page('manifesto')
    const lede = document.createElement('p')
    manifesto!.append(lede)
    vi.spyOn(manifesto!, 'getBoundingClientRect').mockReturnValue({
      top: innerHeight - 32,
    } as DOMRect)
    vi.spyOn(lede, 'getBoundingClientRect').mockReturnValue({
      top: innerHeight + 400,
    } as DOMRect)
    const seen: boolean[] = []
    mountHomeScenes(document, {
      manifesto: ({ belowFold }) => {
        seen.push(belowFold(), belowFold(lede))
      },
    })

    DrivenObserver.current?.enter(manifesto!)
    idle()
    // The section peeks into view; the paragraph further down does not.
    expect(seen).toEqual([false, true])
  })

  it('lays a section out before its scene measures it, and lets go after', () => {
    stubMedia()
    const [parts] = page('parts')
    const seen: string[] = []
    const teardown = mountHomeScenes(document, {
      parts: ({ root }) => {
        seen.push(root.style.contentVisibility)
      },
    })

    DrivenObserver.current?.enter(parts!)
    idle()
    // content-visibility: auto would leave the content unmeasured.
    expect(seen).toEqual(['visible'])
    teardown()
    expect(parts!.style.contentVisibility).toBe('')
  })

  it('leaves sections alone when motion is reduced', () => {
    stubMedia({ reduce: true })
    const [join] = page('join')
    const scene = vi.fn<Scene>()
    mountHomeScenes(document, { join: scene })

    DrivenObserver.current?.enter(join!)
    expect(scene).not.toHaveBeenCalled()
    expect(join).not.toHaveAttribute('data-motion')
  })

  it('keeps a failing scene from taking the others down', () => {
    stubMedia()
    const [log, parts] = page('log', 'parts')
    const good = vi.fn<Scene>()
    mountHomeScenes(document, {
      log: () => {
        throw new Error('scene bug')
      },
      parts: good,
    })

    DrivenObserver.current?.enter(log!)
    idle()
    DrivenObserver.current?.enter(parts!)
    idle()
    expect(log).not.toHaveAttribute('data-motion')
    expect(good).toHaveBeenCalledTimes(1)
  })

  it('never arms a section that was still waiting at teardown', () => {
    stubMedia()
    const [releases] = page('releases')
    const scene = vi.fn<Scene>()
    const teardown = mountHomeScenes(document, { releases: scene })

    DrivenObserver.current?.enter(releases!)
    teardown()
    idle()
    expect(scene).not.toHaveBeenCalled()
  })

  it('reverts every armed scene on teardown', () => {
    stubMedia()
    const [hero] = page('hero')
    const cleanup = vi.fn()
    const teardown = mountHomeScenes(document, { hero: () => cleanup })

    DrivenObserver.current?.enter(hero!)
    idle()
    teardown()
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(hero).not.toHaveAttribute('data-motion')
    expect(DrivenObserver.current?.disconnect).toHaveBeenCalled()
  })
})
