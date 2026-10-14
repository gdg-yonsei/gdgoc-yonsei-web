/** UA 문자열을 기기·브라우저·OS로 나눈다. 카카오톡·인스타그램·네이버 인앱과 웨일을 구분해야 해서 라이브러리 대신 직접 판정한다. */
import 'server-only'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type ParsedUserAgent = {
  deviceType: DeviceType
  browser: string
  os: string
}

// 링크 미리보기 봇, 성능 측정 도구, HTTP 라이브러리도 사람 방문이 아니다.
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|yeti|headless|lighthouse|pagespeed|gtmetrix|preview|facebookexternalhit|embedly|vkshare|whatsapp|telegram|curl\/|wget\/|python-requests|axios\/|node-fetch|go-http-client|java\//i

// 인앱 브라우저 UA에는 Chrome·Safari 토큰도 들어 있어 더 구체적인 것부터 확인한다.
const BROWSERS: Array<[RegExp, string]> = [
  [/KAKAOTALK/i, 'KakaoTalk'],
  [/Instagram/, 'Instagram'],
  [/FBAN|FBAV/, 'Facebook'],
  [/NAVER\(inapp/, 'Naver'],
  [/Whale\//, 'Whale'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Edg(A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/CriOS\/|Chrome\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
]

const OPERATING_SYSTEMS: Array<[RegExp, string]> = [
  [/iPad/, 'iPadOS'],
  [/iPhone|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Macintosh|Mac OS X/, 'macOS'],
  [/Linux/, 'Linux'],
]

function firstMatch(userAgent: string, table: Array<[RegExp, string]>) {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Other'
}

// 안드로이드 태블릿은 UA에 Mobile 토큰이 없다. iPadOS 13 이후 데스크톱 모드 UA는 맥과 구분할 수 없어 데스크톱으로 센다.
function deviceTypeOf(userAgent: string): DeviceType {
  if (/iPad|Tablet/.test(userAgent)) return 'tablet'
  if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android/.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** 알 수 없는 값은 `Other`로 둔다. 화면에서 그룹으로 묶여 보인다. */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  return {
    deviceType: deviceTypeOf(userAgent),
    browser: firstMatch(userAgent, BROWSERS),
    os: firstMatch(userAgent, OPERATING_SYSTEMS),
  }
}

/** UA가 없으면 브라우저가 아닌 클라이언트로 보고 버린다. */
export function isBotUserAgent(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent)
}
