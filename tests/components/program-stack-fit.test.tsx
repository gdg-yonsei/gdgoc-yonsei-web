import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import ProgramStackFit from '@/app/(home)/[lang]/_components/home/program-stack-fit'

type Entry = { target: Element; borderBoxSize: { blockSize: number }[] }

function stubResizeObserver() {
  const observer = {
    notify: undefined as ((entries: Entry[]) => void) | undefined,
    observe: vi.fn(),
    disconnect: vi.fn(),
  }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: (entries: Entry[]) => void) {
        observer.notify = callback
      }
      observe = observer.observe
      unobserve = vi.fn()
      disconnect = observer.disconnect
    }
  )
  return observer
}

describe('ProgramStackFit', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('writes each card height, rounded up, to --card-h', () => {
    const observer = stubResizeObserver()
    const { container, unmount } = render(
      <ProgramStackFit>
        <li className="program-card">T19</li>
        <li className="program-card">Solution Challenge</li>
      </ProgramStackFit>
    )
    const cards = [...container.querySelectorAll('li')]

    expect(observer.observe).toHaveBeenCalledTimes(2)
    act(() =>
      observer.notify?.([
        { target: cards[0]!, borderBoxSize: [{ blockSize: 300 }] },
        { target: cards[1]!, borderBoxSize: [{ blockSize: 310.4 }] },
      ])
    )
    expect(
      cards.map((card) => card.style.getPropertyValue('--card-h'))
    ).toEqual(['300px', '311px'])

    unmount()
    expect(observer.disconnect).toHaveBeenCalled()
  })

  it('still renders the stack where ResizeObserver is missing', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const { container } = render(
      <ProgramStackFit>
        <li className="program-card">T19</li>
      </ProgramStackFit>
    )

    expect(container.querySelector('ol.program-stack > li')).not.toBeNull()
  })
})
