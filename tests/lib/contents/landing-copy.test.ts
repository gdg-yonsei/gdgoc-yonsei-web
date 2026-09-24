import { describe, expect, it } from 'vitest'
import { landingCopy } from '@/lib/contents/site-copy'

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, shape(entry)])
    )
  }
  return typeof value
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings)
  }
  return []
}

describe('landing copy', () => {
  it('has the same structure in English and Korean', () => {
    expect(shape(landingCopy.ko)).toEqual(shape(landingCopy.en))
  })

  it('never leaves a string empty', () => {
    for (const text of [
      ...strings(landingCopy.en),
      ...strings(landingCopy.ko),
    ]) {
      expect(text.trim()).not.toBe('')
    }
  })

  it('stays inside the Latin font subset: no arrow glyphs', () => {
    // An arrow (U+2190–21FF) makes the browser fetch Google Sans Flex's
    // symbols subset for a single title (see common-components.test.tsx).
    for (const text of [
      ...strings(landingCopy.en),
      ...strings(landingCopy.ko),
    ]) {
      expect(text).not.toMatch(/[\u2190-\u21ff]/)
    }
  })

  it('keeps the Solution Challenge numbers identical across languages', () => {
    expect(landingCopy.ko.funnel.steps.map((step) => step.value)).toEqual(
      landingCopy.en.funnel.steps.map((step) => step.value)
    )
  })
})
