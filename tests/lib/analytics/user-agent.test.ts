import { describe, expect, it } from 'vitest'
import {
  isBotUserAgent,
  parseUserAgent,
} from '@/lib/server/analytics/collect/user-agent'

const UA = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  kakaoIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 25.8.0',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 15; SM-S928N Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 Instagram 400.0.0.0.0 Android',
  samsungAndroid:
    'Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  whaleWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Whale/4.33.0.0 Safari/537.36',
  naverApp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.10.0)',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  firefoxLinux:
    'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
  chromeIpad:
    'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X710N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
}

describe('parseUserAgent', () => {
  it.each([
    [
      UA.chromeWindows,
      { deviceType: 'desktop', browser: 'Chrome', os: 'Windows' },
    ],
    [UA.safariMac, { deviceType: 'desktop', browser: 'Safari', os: 'macOS' }],
    [UA.safariIphone, { deviceType: 'mobile', browser: 'Safari', os: 'iOS' }],
    [UA.kakaoIphone, { deviceType: 'mobile', browser: 'KakaoTalk', os: 'iOS' }],
    [
      UA.instagramAndroid,
      { deviceType: 'mobile', browser: 'Instagram', os: 'Android' },
    ],
    [
      UA.samsungAndroid,
      { deviceType: 'mobile', browser: 'Samsung Internet', os: 'Android' },
    ],
    [
      UA.whaleWindows,
      { deviceType: 'desktop', browser: 'Whale', os: 'Windows' },
    ],
    [UA.naverApp, { deviceType: 'mobile', browser: 'Naver', os: 'iOS' }],
    [UA.edgeWindows, { deviceType: 'desktop', browser: 'Edge', os: 'Windows' }],
    [
      UA.firefoxLinux,
      { deviceType: 'desktop', browser: 'Firefox', os: 'Linux' },
    ],
    [UA.chromeIpad, { deviceType: 'tablet', browser: 'Chrome', os: 'iPadOS' }],
    [
      UA.androidTablet,
      { deviceType: 'tablet', browser: 'Chrome', os: 'Android' },
    ],
  ])('parses %s', (userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toEqual(expected)
  })

  it('falls back to Other for unknown agents', () => {
    expect(parseUserAgent('')).toEqual({
      deviceType: 'desktop',
      browser: 'Other',
      os: 'Other',
    })
  })
})

describe('isBotUserAgent', () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd) bingbot',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'facebookexternalhit/1.1',
    'curl/8.9.1',
    'python-requests/2.32.3',
  ])('flags %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true)
  })

  it('flags a missing user agent and keeps real browsers', () => {
    expect(isBotUserAgent(null)).toBe(true)
    expect(isBotUserAgent(UA.kakaoIphone)).toBe(false)
    expect(isBotUserAgent(UA.chromeWindows)).toBe(false)
  })
})
