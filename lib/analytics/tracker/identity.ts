/** 브라우저 저장소의 익명 방문자 ID와 30분 세션. IP·쿠키는 쓰지 않는다. 클라이언트 번들용이라 의존성이 없다. */
import {
  OPT_OUT_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  SESSION_TIMEOUT_MS,
  VISITOR_STORAGE_KEY,
} from '@/lib/analytics/constants'

/** localStorage 또는 그 대체물. 저장소를 쓸 수 없는 브라우저는 메모리 대체물을 넘긴다. */
export type KeyValueStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

export type PageViewIdentity = {
  visitorId: string
  sessionId: string
  isNewVisitor: boolean
  isSessionStart: boolean
  sequence: number
}

type StoredSession = {
  id: string
  lastActivityAt: number
  isNewVisitor: boolean
  sequence: number
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readSession(storage: KeyValueStorage): StoredSession | null {
  try {
    const value = JSON.parse(
      storage.getItem(SESSION_STORAGE_KEY) ?? 'null'
    ) as Partial<StoredSession> | null
    if (
      !value ||
      typeof value.id !== 'string' ||
      !UUID_PATTERN.test(value.id) ||
      typeof value.lastActivityAt !== 'number' ||
      typeof value.sequence !== 'number'
    ) {
      return null
    }
    return {
      id: value.id,
      lastActivityAt: value.lastActivityAt,
      isNewVisitor: value.isNewVisitor === true,
      sequence: value.sequence,
    }
  } catch {
    return null
  }
}

/** GPC, 자동화 브라우저, 처리방침의 거부 설정 중 하나라도 있으면 아무것도 보내지 않는다. */
export function isTrackingAllowed(
  navigator: Navigator,
  storage: KeyValueStorage
): boolean {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean }
  return (
    privacy.globalPrivacyControl !== true &&
    navigator.webdriver !== true &&
    storage.getItem(OPT_OUT_STORAGE_KEY) !== '1'
  )
}

/**
 * 페이지 조회 하나를 세션에 기록하고 식별자를 돌려준다.
 * `persistent`가 false면(저장소 없음) 매번 처음 보는 사람처럼 보이므로 신규 방문자로 세지 않는다.
 */
export function startPageView(
  storage: KeyValueStorage,
  now: number,
  createId: () => string,
  persistent: boolean
): PageViewIdentity {
  let visitorId = storage.getItem(VISITOR_STORAGE_KEY)
  const isFirstVisit = visitorId === null || !UUID_PATTERN.test(visitorId)
  if (visitorId === null || isFirstVisit) {
    visitorId = createId()
    storage.setItem(VISITOR_STORAGE_KEY, visitorId)
  }

  const previous = readSession(storage)
  const isSessionStart =
    !previous || now - previous.lastActivityAt > SESSION_TIMEOUT_MS
  const session: StoredSession =
    !previous || isSessionStart
      ? {
          id: createId(),
          lastActivityAt: now,
          isNewVisitor: persistent && isFirstVisit,
          sequence: 1,
        }
      : { ...previous, lastActivityAt: now, sequence: previous.sequence + 1 }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

  return {
    visitorId,
    sessionId: session.id,
    isNewVisitor: session.isNewVisitor,
    isSessionStart,
    sequence: session.sequence,
  }
}

/** 클릭 같은 활동이 있으면 세션 만료를 늦춘다. 이미 만료된 세션은 살리지 않는다. */
export function touchSession(storage: KeyValueStorage, now: number): void {
  const session = readSession(storage)
  if (session && now - session.lastActivityAt <= SESSION_TIMEOUT_MS) {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...session, lastActivityAt: now })
    )
  }
}

/** 거부하면 식별자도 지워, 다시 허용했을 때 이전 방문과 이어지지 않게 한다. */
export function optOut(storage: KeyValueStorage): void {
  storage.setItem(OPT_OUT_STORAGE_KEY, '1')
  storage.removeItem(VISITOR_STORAGE_KEY)
  storage.removeItem(SESSION_STORAGE_KEY)
}

export function optIn(storage: KeyValueStorage): void {
  storage.removeItem(OPT_OUT_STORAGE_KEY)
}
