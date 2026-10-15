import { describe, expect, it } from 'vitest'
import {
  localeFromPath,
  normalizePath,
  parseReferrer,
} from '@/lib/server/analytics/collect/normalize'
import { countryFromTimezone } from '@/lib/server/analytics/collect/timezone-country'

describe('normalizePath', () => {
  it('drops query, hash and trailing slashes but keeps the root', () => {
    expect(normalizePath('/ko/session/?tag=web#top')).toBe('/ko/session')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('/ko///')).toBe('/ko')
  })
})

describe('localeFromPath', () => {
  it('reads the locale segment and marks everything else as other', () => {
    expect(localeFromPath('/ko/project')).toBe('ko')
    expect(localeFromPath('/en')).toBe('en')
    expect(localeFromPath('/unknown/page')).toBe('other')
  })
})

describe('parseReferrer', () => {
  it('keeps host and path, strips www and never keeps the query', () => {
    expect(
      parseReferrer(
        'https://www.google.com/search?q=gdgoc&email=me@example.com',
        'gdgoc.yonsei.ac.kr'
      )
    ).toEqual({ host: 'google.com', path: '/search' })
  })

  it('treats same-site referrers and non-web schemes as no referrer', () => {
    expect(
      parseReferrer('https://gdgoc.yonsei.ac.kr/ko', 'gdgoc.yonsei.ac.kr')
    ).toBeNull()
    expect(
      parseReferrer(
        'android-app://com.google.android.gm/',
        'gdgoc.yonsei.ac.kr'
      )
    ).toBeNull()
    expect(parseReferrer('not a url', 'gdgoc.yonsei.ac.kr')).toBeNull()
    expect(parseReferrer(undefined, 'gdgoc.yonsei.ac.kr')).toBeNull()
  })
})

describe('countryFromTimezone', () => {
  it('maps known zones and falls back to ZZ', () => {
    expect(countryFromTimezone('Asia/Seoul')).toBe('KR')
    expect(countryFromTimezone('America/Los_Angeles')).toBe('US')
    expect(countryFromTimezone('Mars/Olympus')).toBe('ZZ')
    expect(countryFromTimezone(undefined)).toBe('ZZ')
  })
})
