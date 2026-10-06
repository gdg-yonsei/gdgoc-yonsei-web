// 호출부는 sessions 진입점만 가져온다. 조회·변경·신청·알림 구현은 내부 모듈에 둔다.
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
export type { SessionInput } from '@/lib/server/services/admin/sessions/shared'
