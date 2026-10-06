// UUID 컬럼에 잘못된 형식을 넘기면 PostgreSQL이 500을 내므로 조회 전에 거른다.
import 'server-only'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
