/** 브라우저에서 트래커를 하나만 만든다. localStorage가 막힌 브라우저도 페이지 안에서는 같은 세션으로 이어지게 메모리 저장소로 대체한다. */
import { ANALYTICS_ENDPOINT } from '@/lib/analytics/constants'
import type { KeyValueStorage } from '@/lib/analytics/tracker/identity'
import { createTracker, type Tracker } from '@/lib/analytics/tracker/tracker'

let tracker: Tracker | null = null

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

/** 사파리 사생활 보호 모드처럼 저장 시 예외가 나는 경우까지 확인한다. */
export function readBrowserStorage(): {
  storage: KeyValueStorage
  persistent: boolean
} {
  try {
    const probe = '__gyms_probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return { storage: window.localStorage, persistent: true }
  } catch {
    return { storage: memoryStorage(), persistent: false }
  }
}

// text/plain은 CORS 단순 요청 형식이라 브라우저가 sendBeacon을 거절하지 않는다. 서버는 본문을 직접 JSON으로 읽는다.
const BODY_TYPE = 'text/plain;charset=UTF-8'

/** 페이지를 떠나는 중에도 전송되도록 sendBeacon을 먼저 쓴다. 실패는 무시한다(분석 손실이 화면 오류보다 낫다). */
export function sendBeaconOrFetch(body: string): void {
  if (
    navigator.sendBeacon?.(
      ANALYTICS_ENDPOINT,
      new Blob([body], { type: BODY_TYPE })
    )
  ) {
    return
  }
  fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': BODY_TYPE },
  }).catch(() => {})
}

/** 서버 렌더링 중에는 null. */
export function getBrowserTracker(): Tracker | null {
  if (typeof window === 'undefined') return null
  if (!tracker) {
    const { storage, persistent } = readBrowserStorage()
    tracker = createTracker({
      window,
      storage,
      persistent,
      now: () => Date.now(),
      createId: () => crypto.randomUUID(),
      send: sendBeaconOrFetch,
    })
  }
  return tracker
}
