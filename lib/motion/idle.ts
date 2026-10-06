// 연출 청크 실패 시 정적 화면을 유지한다. 해제 시 유휴 예약을 취소하거나 붙인 연출을 정리한다.

/** `requestIdleCallback`이 없는 브라우저(Safari 등)에서 대신 기다릴 시간(ms). */
const IDLE_FALLBACK_DELAY_MS = 1200

/** 유휴 콜백이 이 시간 안에 오지 않으면 강제로 실행한다(ms). */
const IDLE_TIMEOUT_MS = 2500

// load의 동적 import는 청크 분할을 위해 호출부에 둔다. 반환값은 useEffect 정리 함수다.
export function mountWhenIdle<M>(
  load: () => Promise<M>,
  mount: (module: M) => (() => void) | undefined
): () => void {
  let cancelled = false
  let teardown: (() => void) | undefined

  const start = () => {
    load()
      .then((module) => {
        if (!cancelled) teardown = mount(module)
      })
      .catch(() => {})
  }

  const hasIdle = typeof window.requestIdleCallback === 'function'
  const handle = hasIdle
    ? window.requestIdleCallback(start, { timeout: IDLE_TIMEOUT_MS })
    : window.setTimeout(start, IDLE_FALLBACK_DELAY_MS)

  return () => {
    cancelled = true
    if (hasIdle) window.cancelIdleCallback(handle)
    else window.clearTimeout(handle)
    teardown?.()
  }
}
