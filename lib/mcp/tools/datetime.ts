/**
 * MCP 세션 도구의 일시 입력 해석.
 */
import 'server-only'

const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/
const WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 세션 일시 입력을 저장 규칙(서울 벽시계를 UTC 라벨로 저장)에 맞춘다.
 * - 오프셋 없는 `YYYY-MM-DDTHH:mm[:ss]` 는 서울 시각으로 보고 그대로 UTC 라벨을 붙인다
 *   (웹 폼의 datetime-local 해석과 같다).
 * - 오프셋이 있으면 그 순간을 서울 벽시계로 옮긴다(서울은 서머타임이 없다).
 */
export function parseSessionDateTime(value: string): Date | null {
  if (LOCAL.test(value)) {
    const date = new Date(`${value}Z`)
    // 2026-02-30 처럼 넘치는 날짜는 다른 날로 굴러가므로 되돌려 비교한다.
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
      ? date
      : null
  }

  if (WITH_OFFSET.test(value)) {
    const instant = Date.parse(value)
    return Number.isNaN(instant) ? null : new Date(instant + SEOUL_OFFSET_MS)
  }

  return null
}
