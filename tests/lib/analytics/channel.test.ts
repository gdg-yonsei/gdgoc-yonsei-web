import { describe, expect, it } from 'vitest'
import { classifyChannel } from '@/lib/server/analytics/collect/channel'

const none = {
  referrerHost: null,
  utmSource: null,
  utmMedium: null,
  hasUtm: false,
}

describe('classifyChannel', () => {
  it.each([
    [{ ...none }, 'Direct'],
    [{ ...none, referrerHost: 'google.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'google.co.kr' }, 'Organic Search'],
    [{ ...none, referrerHost: 'm.search.naver.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'search.daum.net' }, 'Organic Search'],
    [{ ...none, referrerHost: 'bing.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'docs.google.com' }, 'Referral'],
    [{ ...none, referrerHost: 'blog.naver.com' }, 'Organic Social'],
    [{ ...none, referrerHost: 'l.instagram.com' }, 'Organic Social'],
    [{ ...none, referrerHost: 'everytime.kr' }, 'Organic Social'],
    [{ ...none, referrerHost: 't.co' }, 'Organic Social'],
    [{ ...none, referrerHost: 'chatgpt.com' }, 'AI Assistants'],
    [{ ...none, referrerHost: 'gemini.google.com' }, 'AI Assistants'],
    [{ ...none, referrerHost: 'perplexity.ai' }, 'AI Assistants'],
    [{ ...none, utmSource: 'chatgpt.com', hasUtm: true }, 'AI Assistants'],
    [{ ...none, referrerHost: 'velog.io' }, 'Referral'],
    [
      { ...none, utmSource: 'naver', utmMedium: 'cpc', hasUtm: true },
      'Paid Search',
    ],
    [
      {
        ...none,
        utmSource: 'instagram',
        utmMedium: 'paid_social',
        hasUtm: true,
      },
      'Paid Social',
    ],
    [
      { ...none, utmSource: 'newsletter', utmMedium: 'email', hasUtm: true },
      'Email',
    ],
    [
      { ...none, utmSource: 'kakao', utmMedium: 'social', hasUtm: true },
      'Organic Social',
    ],
    [
      { ...none, utmSource: 'poster', utmMedium: 'qr', hasUtm: true },
      'Campaign',
    ],
  ] as const)('%o → %s', (input, expected) => {
    expect(classifyChannel(input)).toBe(expected)
  })
})
