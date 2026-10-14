/** GA4 기본 채널 그룹을 동아리 사이트에 맞게 줄인 분류. 위에서부터 먼저 맞는 규칙이 이긴다(명세 5장 표). */
import 'server-only'

import type { Channel } from '@/lib/analytics/constants'

// google.* 의 다른 서브도메인(docs, mail)은 검색이 아니라 리퍼럴이다. gemini.google.com은 AI 규칙이 먼저 잡는다.
const SEARCH_HOSTS = [
  /^(www\.|m\.)?google\.[a-z.]+$/,
  /(^|\.)bing\.com$/,
  /(^|\.)search\.naver\.com$/,
  /(^|\.)search\.daum\.net$/,
  /(^|\.)search\.yahoo\.[a-z.]+$/,
  /(^|\.)duckduckgo\.com$/,
  /(^|\.)ecosia\.org$/,
  /(^|\.)baidu\.com$/,
  /(^|\.)yandex\.[a-z.]+$/,
  /(^|\.)search\.zum\.com$/,
  /(^|\.)search\.nate\.com$/,
]
const SEARCH_SOURCES =
  /^(google|naver|daum|bing|yahoo|duckduckgo|baidu|yandex)$/i

const SOCIAL_HOSTS = [
  /(^|\.)instagram\.com$/,
  /(^|\.)facebook\.com$/,
  /^t\.co$/,
  /(^|\.)x\.com$/,
  /(^|\.)twitter\.com$/,
  /(^|\.)threads\.(net|com)$/,
  /(^|\.)linkedin\.com$/,
  /^lnkd\.in$/,
  /(^|\.)youtube\.com$/,
  /(^|\.)kakao\.com$/,
  /(^|\.)everytime\.kr$/,
  /(^|\.)discord(app)?\.com$/,
  /(^|\.)reddit\.com$/,
  /^(blog|cafe|m\.blog|m\.cafe)\.naver\.com$/,
  /(^|\.)band\.us$/,
]
const SOCIAL_SOURCES =
  /^(instagram|ig|facebook|fb|twitter|x|threads|linkedin|youtube|kakao|kakaotalk|everytime|discord|reddit|band)$/i
const SOCIAL_MEDIUMS =
  /^(social|social-network|social-media|sm|social network|social media)$/i

// ChatGPT는 링크에 utm_source=chatgpt.com을 붙이므로 출처 값도 같은 목록으로 확인한다.
const AI_HOSTS = [
  /(^|\.)chatgpt\.com$/,
  /^chat\.openai\.com$/,
  /(^|\.)perplexity\.ai$/,
  /^claude\.ai$/,
  /^gemini\.google\.com$/,
  /^copilot\.microsoft\.com$/,
  /(^|\.)poe\.com$/,
  /^chat\.deepseek\.com$/,
  /(^|\.)grok\.com$/,
]

// GA4의 유료 매체 정규식과 같다.
const PAID_MEDIUM = /^(.*cp.*|ppc|retargeting|paid.*)$/i
const EMAIL = /e[-_ ]?mail|newsletter/i

function matchesAny(value: string | null | undefined, patterns: RegExp[]) {
  return value
    ? patterns.some((pattern) => pattern.test(value.toLowerCase()))
    : false
}

/** `referrerHost`는 www를 뗀 외부 호스트다. 같은 사이트 리퍼러는 호출 전에 `null`로 바꾼다. */
export function classifyChannel(input: {
  referrerHost: string | null
  utmSource?: string | null
  utmMedium?: string | null
  hasUtm: boolean
}): Channel {
  const { referrerHost, utmSource, utmMedium } = input
  const isSearch =
    matchesAny(referrerHost, SEARCH_HOSTS) ||
    SEARCH_SOURCES.test(utmSource ?? '')
  const isSocial =
    matchesAny(referrerHost, SOCIAL_HOSTS) ||
    SOCIAL_SOURCES.test(utmSource ?? '') ||
    SOCIAL_MEDIUMS.test(utmMedium ?? '')

  if (utmMedium && PAID_MEDIUM.test(utmMedium)) {
    if (isSearch) return 'Paid Search'
    if (isSocial) return 'Paid Social'
  }
  if (EMAIL.test(utmMedium ?? '') || EMAIL.test(utmSource ?? '')) return 'Email'
  if (matchesAny(referrerHost, AI_HOSTS) || matchesAny(utmSource, AI_HOSTS)) {
    return 'AI Assistants'
  }
  if (isSearch) return 'Organic Search'
  if (isSocial) return 'Organic Social'
  if (referrerHost) return 'Referral'
  if (input.hasUtm) return 'Campaign'
  return 'Direct'
}
