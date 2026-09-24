import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import BracketStage from '@/app/(home)/[lang]/_components/home/bracket-stage'

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
    renderInHero()
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1200)
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
})
