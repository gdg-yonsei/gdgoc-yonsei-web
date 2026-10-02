import { describe, expect, it } from 'vitest'
import {
  isLocale,
  localizedPath,
  pickLocalized,
  toIntlLocale,
  toLocale,
} from '@/lib/i18n'

describe('toLocale', () => {
  it('returns ko only when lang is ko', () => {
    expect(toLocale('ko')).toBe('ko')
  })

  it('returns en for every other language param', () => {
    expect(toLocale('en')).toBe('en')
    expect(toLocale('jp')).toBe('en')
    expect(toLocale('')).toBe('en')
    expect(toLocale(undefined)).toBe('en')
  })
})

describe('isLocale', () => {
  it('accepts only supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ko')).toBe(true)
    expect(isLocale('jp')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('toIntlLocale', () => {
  it('maps to BCP 47 tags', () => {
    expect(toIntlLocale('ko')).toBe('ko-KR')
    expect(toIntlLocale('en')).toBe('en-US')
  })
})

describe('pickLocalized', () => {
  it('prefers the requested locale', () => {
    expect(pickLocalized('ko', { en: 'Kickoff', ko: '킥오프' })).toBe('킥오프')
    expect(pickLocalized('en', { en: 'Kickoff', ko: '킥오프' })).toBe('Kickoff')
  })

  it('falls back to the other locale in both directions', () => {
    expect(pickLocalized('ko', { en: 'Kickoff', ko: '' })).toBe('Kickoff')
    expect(pickLocalized('en', { en: null, ko: '킥오프' })).toBe('킥오프')
  })

  it('returns null when both are empty', () => {
    expect(pickLocalized('en', { en: '', ko: null })).toBeNull()
  })
})

describe('localizedPath', () => {
  it.each([
    ['/en', 'ko', '/ko'],
    ['/en/session/25-26/f8c1fc4a', 'ko', '/ko/session/25-26/f8c1fc4a'],
    ['/ko/project', 'en', '/en/project'],
    [null, 'ko', '/ko'],
    ['/', 'en', '/en'],
    ['/privacy', 'ko', '/ko/privacy'],
  ] as const)('%s → %s', (pathname, locale, expected) => {
    expect(localizedPath(pathname, locale)).toBe(expected)
  })
})
