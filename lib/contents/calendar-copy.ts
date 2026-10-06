// 클라이언트에는 현재 언어 문구만 prop으로 넘긴다. 함수는 전송할 수 없어 개수 문구는 {count} 템플릿이다.
import type { Locale } from '@/lib/i18n'

export const calendarPageCopy = {
  en: {
    title: 'Calendar',
    description:
      'Upcoming and past sessions, workshops, hackathons and community events, in Seoul time.',
    metaDescription:
      'Check upcoming GDGoC Yonsei technical sessions, workshops, project events, and community activities on the chapter calendar.',
  },
  ko: {
    title: '캘린더',
    description:
      '예정된 세션과 지난 세션, 워크숍, 해커톤과 커뮤니티 행사 일정을 서울 시간으로 확인하세요.',
    metaDescription:
      'GDGoC Yonsei의 기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 챕터 캘린더에서 확인하세요.',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type CalendarWidgetCopy = {
  weekdays: readonly string[]
  previous: string
  next: string
  today: string
  wholeMonth: string
  scheduled: string
  monthEmpty: string
  dayEmpty: string
  countNone: string
  countOne: string
  countMany: string
  more: string
}

export const calendarWidgetCopy: Record<Locale, CalendarWidgetCopy> = {
  en: {
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    previous: 'Previous month',
    next: 'Next month',
    today: 'Today',
    wholeMonth: 'Show the whole month',
    scheduled: 'Scheduled',
    monthEmpty: 'No sessions this month.',
    dayEmpty: 'No sessions on this day.',
    countNone: 'no sessions',
    countOne: '1 session',
    countMany: '{count} sessions',
    more: '+{count} more',
  },
  ko: {
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    previous: '이전 달',
    next: '다음 달',
    today: '오늘',
    wholeMonth: '이번 달 전체 보기',
    scheduled: '예정',
    monthEmpty: '이번 달에는 세션이 없습니다.',
    dayEmpty: '이 날에는 세션이 없습니다.',
    countNone: '세션 없음',
    countOne: '세션 1개',
    countMany: '세션 {count}개',
    more: '+{count}개 더',
  },
}
