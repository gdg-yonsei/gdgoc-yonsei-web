import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import HomeMotion from '@/app/(home)/[lang]/_components/home/home-motion'

const scenes = vi.hoisted(() => ({
  teardown: vi.fn(),
  mount: vi.fn(),
}))

vi.mock('@/app/(home)/[lang]/_components/home/motion/scenes', () => ({
  mountHomeScenes: scenes.mount,
}))

function stubMotion({ reduce = false } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
    }))
  )
}

/** Captures the idle callback so a test decides when the browser is idle. */
function stubIdle() {
  const idle = { start: undefined as (() => void) | undefined }
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: () => void) => {
      idle.start = callback
      return 3
    })
  )
  vi.stubGlobal('cancelIdleCallback', vi.fn())
  return idle
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('HomeMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'connection')
    delete document.documentElement.dataset.homeMotion
  })

  it('never schedules the motion chunk when motion is reduced', () => {
    stubMotion({ reduce: true })
    const idle = stubIdle()
    render(<HomeMotion />)

    expect(requestIdleCallback).not.toHaveBeenCalled()
    expect(idle.start).toBeUndefined()
  })

  it('never schedules it for visitors saving data', () => {
    stubMotion()
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    })
    stubIdle()
    render(<HomeMotion />)

    expect(requestIdleCallback).not.toHaveBeenCalled()
  })

  it('mounts the scenes once the browser is idle, and tears them down', async () => {
    stubMotion()
    const idle = stubIdle()
    scenes.mount.mockReturnValue(scenes.teardown)
    const { unmount } = render(<HomeMotion />)

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 2500,
    })
    expect(scenes.mount).not.toHaveBeenCalled()

    idle.start?.()
    await flush()
    expect(scenes.mount).toHaveBeenCalledWith(document)
    expect(document.documentElement.dataset.homeMotion).toBe('ready')

    unmount()
    expect(scenes.teardown).toHaveBeenCalled()
    expect(document.documentElement.dataset.homeMotion).toBeUndefined()
  })

  it('keeps the static page when the scenes fail to mount', async () => {
    stubMotion()
    const idle = stubIdle()
    scenes.mount.mockImplementation(() => {
      throw new Error('scene bug')
    })
    const { unmount } = render(<HomeMotion />)

    idle.start?.()
    await flush()
    expect(document.documentElement.dataset.homeMotion).toBeUndefined()
    unmount()
  })
})
