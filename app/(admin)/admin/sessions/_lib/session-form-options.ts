/** 선택지 값은 DB enum 및 `SESSION_TYPES`·`ACTIVITY_CATEGORIES`와 일치해야 한다. */
import type { AdminMessages } from '@/lib/admin-i18n'
import type { ActivityCategory, SessionType } from '@/lib/validations/session'

export function sessionTypeOptions(
  t: AdminMessages
): { name: string; value: SessionType }[] {
  return [
    { name: t.generalSession, value: 'General Session' },
    { name: t.partSession, value: 'Part Session' },
  ]
}

/** 공개 사이트 세션 기록에서 쓰는 활동 분류 선택지. 고유 명칭이라 번역하지 않는다. */
export const SESSION_CATEGORY_OPTIONS: {
  name: string
  value: ActivityCategory
}[] = [
  { name: 'Tech Talk (T19)', value: 'tech_talk' },
  { name: 'Part Session', value: 'part_session' },
  { name: 'Hackathon', value: 'hackathon' },
  { name: 'Demo Day', value: 'demo_day' },
  { name: 'DevRel / Social', value: 'devrel' },
]
