import { describe, expect, it } from 'vitest'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLanguageAlternates,
  getLocalizedUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import { localizeSitemapEntries } from '@/lib/seo/sitemap'
import { serializeJsonLd } from '@/app/components/json-ld'

describe('SEO URL and metadata helpers', () => {
  it('builds canonical locale URLs without trailing slashes', () => {
    expect(getLocalizedUrl('en')).toBe('https://gdgoc.yonsei.ac.kr/en')
    expect(getLocalizedUrl('ko', '/calendar/')).toBe(
      'https://gdgoc.yonsei.ac.kr/ko/calendar'
    )
  })

  it('keeps external asset URLs and resolves local asset paths', () => {
    expect(getAbsoluteUrl('https://cdn.example.com/image.png')).toBe(
      'https://cdn.example.com/image.png'
    )
    expect(getAbsoluteUrl('/project-default.png')).toBe(
      'https://gdgoc.yonsei.ac.kr/project-default.png'
    )
  })

  it('creates a full, bidirectional hreflang set with x-default', () => {
    expect(getLanguageAlternates('/calendar')).toEqual({
      en: 'https://gdgoc.yonsei.ac.kr/en/calendar',
      ko: 'https://gdgoc.yonsei.ac.kr/ko/calendar',
      'x-default': 'https://gdgoc.yonsei.ac.kr/en/calendar',
    })
  })

  it('creates self-referencing canonical and localized social metadata', () => {
    const metadata = createLocalizedMetadata({
      locale: 'ko',
      path: '/calendar',
      title: '캘린더',
      description: 'GDGoC Yonsei의 공식 일정입니다.',
    })

    expect(metadata.alternates?.canonical).toBe(
      'https://gdgoc.yonsei.ac.kr/ko/calendar'
    )
    expect(metadata.alternates?.languages).toEqual({
      en: 'https://gdgoc.yonsei.ac.kr/en/calendar',
      ko: 'https://gdgoc.yonsei.ac.kr/ko/calendar',
      'x-default': 'https://gdgoc.yonsei.ac.kr/en/calendar',
    })
    expect(metadata.openGraph).toMatchObject({
      locale: 'ko_KR',
      alternateLocale: ['en_US'],
      url: 'https://gdgoc.yonsei.ac.kr/ko/calendar',
      images: [{ url: 'https://gdgoc.yonsei.ac.kr/opengraph-image.png' }],
    })
    expect(metadata.twitter).toMatchObject({
      images: ['https://gdgoc.yonsei.ac.kr/twitter-image.png'],
    })
  })

  it('strips markup and limits dynamic descriptions', () => {
    const description = summarizeForMetadata(
      '# Heading\n\n[A useful link](https://example.com) ' +
        'detail '.repeat(40),
      'Fallback'
    )

    expect(description).not.toContain('#')
    expect(description).not.toContain('https://')
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description.endsWith('…')).toBe(true)
  })
})

describe('localized sitemap entries', () => {
  it('emits every locale with the same complete hreflang set', () => {
    const entries = localizeSitemapEntries([
      { path: '/calendar', lastModified: new Date('2026-07-01T00:00:00Z') },
    ])

    expect(entries).toHaveLength(2)
    expect(entries.map((entry) => entry.url)).toEqual([
      'https://gdgoc.yonsei.ac.kr/en/calendar',
      'https://gdgoc.yonsei.ac.kr/ko/calendar',
    ])

    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({
        en: 'https://gdgoc.yonsei.ac.kr/en/calendar',
        ko: 'https://gdgoc.yonsei.ac.kr/ko/calendar',
        'x-default': 'https://gdgoc.yonsei.ac.kr/en/calendar',
      })
    }
  })
})

describe('JSON-LD serialization', () => {
  it('escapes markup that could terminate the script element', () => {
    const serialized = serializeJsonLd({ name: '</script><script>alert(1)' })

    expect(serialized).not.toContain('<')
    expect(serialized).toContain('\\u003c/script>')
  })
})
