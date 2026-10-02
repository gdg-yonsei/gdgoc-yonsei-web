/**
 * 공개 캘린더 페이지(`/[lang]/calendar`) 문구.
 *
 * - `calendarPageCopy`: 서버에서 쓰는 제목·설명·메타 설명
 * - `calendarWidgetCopy`: 달력 클라이언트 컴포넌트에 넘기는 문구. 클라이언트에는 현재
 *   언어 것만 prop으로 넘겨 번들에 두 언어 사전이 실리지 않게 한다. 함수는 서버에서
 *   클라이언트로 넘길 수 없으므로 개수 문구는 `{count}` 템플릿으로 둔다.
 */
import type { Locale } from '@/lib/i18n'

/** 캘린더 페이지 제목·설명(서버 전용). */
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

/** 달력 위젯 문구 한 벌. */
export type CalendarWidgetCopy = {
  weekdays: readonly string[]
  previous: string
  next: string
  today: string
  wholeMonth: string
  scheduled: string
  monthEmpty: string
  dayEmpty: string
  /** 날짜 칸 접근성 라벨의 세션 개수: 0개, 1개, 여러 개. */
  countNone: string
  countOne: string
  countMany: string
  /** 칸에 다 못 보인 일정 수(`+{count} more`). */
  more: string
}

/** 달력 위젯 문구(언어별). 페이지가 현재 언어 것만 골라 넘긴다. */
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
