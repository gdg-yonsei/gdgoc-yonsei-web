/**
 * 브라우저가 한가할 때 무거운 연출 모듈을 불러와 붙이는 헬퍼.
 *
 * 홈 화면의 WebGL 배경(`bracket-stage`)과 스크롤 연출(`home-motion`)이 같은 생명주기를
 * 쓴다: 유휴 시간에 청크를 내려받고, 컴포넌트가 사라지면 예약을 취소하거나 연출을
 * 걷어낸다. 청크 로드가 실패해도 정적 화면이 그대로 남으므로 오류는 무시한다.
 */

/** `requestIdleCallback`이 없는 브라우저(Safari 등)에서 대신 기다릴 시간(ms). */
const IDLE_FALLBACK_DELAY_MS = 1200

/** 유휴 콜백이 이 시간 안에 오지 않으면 강제로 실행한다(ms). */
const IDLE_TIMEOUT_MS = 2500

/**
 * 유휴 시간에 `load`로 모듈을 불러오고 `mount`로 화면에 붙인다.
 * `useEffect` 정리 함수로 쓸 수 있는 해제 함수를 돌려준다.
 *
 * @param load - 동적 `import()`를 감싼 함수. 번들러가 청크를 나누도록 호출부에 둔다.
 * @param mount - 불러온 모듈로 연출을 시작하고, 정리 함수를 돌려준다.
 */
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
