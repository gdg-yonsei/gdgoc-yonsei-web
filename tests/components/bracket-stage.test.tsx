import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import BracketStage from '@/app/(home)/[lang]/_components/home/bracket-stage'

// A stale or blocked chunk: the dynamic import rejects.
vi.mock('@/app/(home)/[lang]/_components/home/bracket-field-gl', () => {
  throw new Error('stale chunk')
})

function renderInHero() {
  return render(
    <section data-hero>
      <BracketStage />
    </section>
  )
}

describe('BracketStage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('never schedules the WebGL field when motion is reduced', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
      }))
    )
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    const idle = vi.fn()
    vi.stubGlobal('requestIdleCallback', idle)
    renderInHero()
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1200)
    expect(idle).not.toHaveBeenCalled()
  })

  it('defers the field until the browser is idle otherwise', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: false, media: query }))
    )
    const idle = vi.fn(() => 7)
    vi.stubGlobal('requestIdleCallback', idle)
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    const { unmount } = renderInHero()
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 2500 })
    unmount()
  })

  it('keeps the poster when the field chunk fails to load', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: false, media: query }))
    )
    let start: (() => void) | undefined
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn((callback: () => void) => {
        start = callback
        return 1
      })
    )
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    const { container, unmount } = renderInHero()

    start?.()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(container.querySelector('[data-hero]')).not.toHaveAttribute(
      'data-gl'
    )
    unmount()
  })
})
