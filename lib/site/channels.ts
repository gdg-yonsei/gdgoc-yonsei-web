// 공식 채널 주소는 푸터·JSON-LD·llms.txt·관리자 캘린더 안내가 공유한다.
export const CHANNELS = {
  instagram: 'https://www.instagram.com/gdg.yonseiuniv/',
  linkedin: 'https://www.linkedin.com/company/gdsc-yonsei/',
  chapter:
    'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/',
  source: 'https://github.com/gdg-yonsei/gdgoc-yonsei-web',
  email: 'gdsc.yonsei.univ@gmail.com',
} as const

const GOOGLE_CALENDAR_ID =
  '677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c@group.calendar.google.com'

const GOOGLE_CALENDAR_ICS = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`

// Google 구독 링크의 cid는 캘린더 ID의 base64다. webcal은 대응 앱, ics는 복사용 주소다.
export const GOOGLE_CALENDAR = {
  googleSubscribe: `https://calendar.google.com/calendar/u/0?cid=${btoa(GOOGLE_CALENDAR_ID).replace(/=+$/, '')}`,
  webcal: GOOGLE_CALENDAR_ICS.replace(/^https:/, 'webcal:'),
  ics: GOOGLE_CALENDAR_ICS,
} as const
