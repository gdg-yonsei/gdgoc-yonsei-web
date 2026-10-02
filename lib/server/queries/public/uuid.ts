/**
 * UUID 형식 검사. UUID 컬럼에 형식이 틀린 값을 넘기면 PostgreSQL이 오류(500)를 내므로 조회 전에 거른다.
 */
import 'server-only'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** 문자열이 UUID(대소문자 무관) 형식인지. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
