import { afterEach, describe, expect, it, vi } from 'vitest'
import { whenPresent } from '@/lib/motion/present'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('whenPresent', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('hands over an element that is already there', () => {
    document.body.innerHTML = '<section><ol class="log-rows"></ol></section>'
    const ready = vi.fn()
    whenPresent(document.querySelector('section')!, '.log-rows', ready)

    expect(ready).toHaveBeenCalledWith(document.querySelector('.log-rows'))
  })

  it('waits for an element that streams in later, once', async () => {
    document.body.innerHTML = '<section><div class="skeleton"></div></section>'
    const section = document.querySelector('section')!
    const ready = vi.fn()
    whenPresent(section, '.log-rows', ready)
    expect(ready).not.toHaveBeenCalled()

    section.innerHTML = '<ol class="log-rows"></ol>'
    await flush()
    section.append(document.createElement('p'))
    await flush()
    expect(ready).toHaveBeenCalledTimes(1)
  })

  it('stops waiting when told to', async () => {
    document.body.innerHTML = '<section></section>'
    const section = document.querySelector('section')!
    const ready = vi.fn()
    const stop = whenPresent(section, '.log-rows', ready)

    stop()
    section.innerHTML = '<ol class="log-rows"></ol>'
    await flush()
    expect(ready).not.toHaveBeenCalled()
  })
})
