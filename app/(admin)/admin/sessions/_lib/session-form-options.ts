/**
 * 세션 생성·수정 폼의 선택지 목록.
 *
 * 두 화면이 같은 선택지를 쓰도록 한 곳에 둔다. 값(`value`)은 DB enum과 같아야 하며
 * `lib/validations/session.ts`의 `SESSION_TYPES`, `ACTIVITY_CATEGORIES`와 짝을 이룬다.
 */
import type { AdminMessages } from '@/lib/admin-i18n'
import type { ActivityCategory, SessionType } from '@/lib/validations/session'

/** 세션 종류 선택지(일반 세션 / 파트 세션). */
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
