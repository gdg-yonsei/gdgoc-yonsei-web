/**
 * 공식 채널 주소 모음. 푸터, 홈 화면 구조화 데이터, `llms.txt`, 관리자 홈의 캘린더 구독 안내가 함께 쓴다.
 * 채널 주소가 바뀌면 이 파일만 고친다.
 */
export const CHANNELS = {
  instagram: 'https://www.instagram.com/gdg.yonseiuniv/',
  linkedin: 'https://www.linkedin.com/company/gdsc-yonsei/',
  chapter:
    'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/',
  source: 'https://github.com/gdg-yonsei/gdgoc-yonsei-web',
  email: 'gdsc.yonsei.univ@gmail.com',
} as const

/** GDGoC Yonsei 공개 Google 캘린더 id. */
const GOOGLE_CALENDAR_ID =
  '677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c@group.calendar.google.com'

/** 공개 iCal 주소. 캘린더 앱에 "URL로 구독"할 때 쓴다. */
const GOOGLE_CALENDAR_ICS = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`

/**
 * 공식 캘린더 구독 주소(관리자 홈의 "캘린더 구독" 안내).
 *
 * - `googleSubscribe`: Google 캘린더 웹의 구독 링크(`cid`는 캘린더 id의 base64)
 * - `webcal`: Apple 캘린더 등 `webcal://`을 처리하는 앱용
 * - `ics`: 직접 복사해 붙여 넣는 iCal 주소
 */
export const GOOGLE_CALENDAR = {
  googleSubscribe: `https://calendar.google.com/calendar/u/0?cid=${btoa(GOOGLE_CALENDAR_ID).replace(/=+$/, '')}`,
  webcal: GOOGLE_CALENDAR_ICS.replace(/^https:/, 'webcal:'),
  ics: GOOGLE_CALENDAR_ICS,
} as const
