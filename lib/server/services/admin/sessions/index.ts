/**
 * 세션 관리 서비스 공개 진입점.
 *
 * 호출부는 `@/lib/server/services/admin/sessions`만 import한다. 구현은 역할별
 * 파일(조회, 생성·수정·삭제, 참가 신청, 알림 메일)로 나뉘어 있다.
 */
export {
  getSessionDetail,
  listSessions,
  sessionToInput,
  type SessionDetail,
} from '@/lib/server/services/admin/sessions/queries'
export {
  createSession,
  deleteSession,
  updateSession,
} from '@/lib/server/services/admin/sessions/mutations'
export {
  registerForSession,
  removeSessionParticipant,
  unregisterFromSession,
} from '@/lib/server/services/admin/sessions/registration'
/** 세션 입력(검증 전) 타입. */
export type { SessionInput } from '@/lib/server/services/admin/sessions/shared'
