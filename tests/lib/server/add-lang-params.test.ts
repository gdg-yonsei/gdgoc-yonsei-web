import { describe, expect, it } from 'vitest'
import addLangParams from '@/lib/server/add-lang-params'

describe('addLangParams', () => {
  it('expands each param to all languages', () => {
    const input = [{ id: 1 }, { id: 2 }]

    expect(addLangParams(input, ['ko', 'en'])).toEqual([
      { id: 1, lang: 'ko' },
      { id: 1, lang: 'en' },
      { id: 2, lang: 'ko' },
      { id: 2, lang: 'en' },
    ])
  })

  it('does not mutate the original array items', () => {
    const input = [{ id: 1 }]

    addLangParams(input, ['ko'])
    expect(input).toEqual([{ id: 1 }])
  })
})
