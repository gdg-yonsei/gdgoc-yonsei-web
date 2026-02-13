import { describe, expect, it } from 'vitest'
import languageParamChecker from '@/lib/language-param-checker'

describe('languageParamChecker', () => {
  it('returns ko only when lang is ko', () => {
    expect(languageParamChecker('ko')).toBe('ko')
  })

  it('returns en for every other language param', () => {
    expect(languageParamChecker('en')).toBe('en')
    expect(languageParamChecker('jp')).toBe('en')
    expect(languageParamChecker('')).toBe('en')
  })
})
